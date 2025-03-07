import prisma from "@/src/lib/prisma";
import axios from "axios";
import { MediaAttachment } from "@prisma/client";
import { PostStatus } from "@prisma/client";
import logger from "@/src/services/logger";
import { sendEmail } from "@/src/lib/mailer";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";
const LINKEDIN_API_URL_V1 = "https://api.linkedin.com/v1";

interface LinkedInError {
  status: number;
  message: string;
  code?: string;
}

export class LinkedInService {
  private static instance: LinkedInService;
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  private constructor() {}

  public static getInstance(): LinkedInService {
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService();
    }
    return LinkedInService.instance;
  }

  private async delayForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async handleLinkedInError(error: any): Promise<LinkedInError> {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "LinkedIn API error";
      const code = error.response.data?.code;

      switch (status) {
        case 401:
          return {
            status,
            message: "Authentication failed. Token may be expired.",
            code,
          };
        case 403:
          return {
            status,
            message: "Access denied. Insufficient permissions.",
            code,
          };
        case 429:
          return {
            status,
            message: "Rate limit exceeded. Please try again later.",
            code,
          };
        case 500:
          return {
            status,
            message: "LinkedIn API is currently unavailable.",
            code,
          };
        default:
          return {
            status,
            message,
            code,
          };
      }
    }

    if (error.request) {
      return {
        status: 0,
        message: "Network error. Please check your connection.",
      };
    }

    return {
      status: 0,
      message: error.message || "An unexpected error occurred.",
    };
  }

  private async refreshTokenIfNeeded(socialAccount: any) {
    if (!socialAccount.refreshToken) return;

    const tokenExpiry = new Date(socialAccount.tokenExpiry);
    const now = new Date();
    const timeUntilExpiry = tokenExpiry.getTime() - now.getTime();

    // Refresh token if it expires in less than 5 minutes
    if (timeUntilExpiry < 5 * 60 * 1000) {
      try {
        await this.delayForRateLimit();
        const response = await fetch(
          "https://www.linkedin.com/oauth/v2/accessToken",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: socialAccount.refreshToken,
              client_id: process.env.LINKEDIN_CLIENT_ID!,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await response.json();
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + data.expires_in);

        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || socialAccount.refreshToken,
            tokenExpiry: expiryDate,
          },
        });

        return data.access_token;
      } catch (error) {
        logger.error("Error refreshing LinkedIn token:", error);
        throw error;
      }
    }

    return socialAccount.accessToken;
  }

  public async publishPost(post: any, socialAccount: any) {
    try {
      await this.delayForRateLimit();
      const accessToken = await this.refreshTokenIfNeeded(socialAccount);

      // Upload media if present
      const mediaIds = [];
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          try {
            const mediaId = await this.uploadMedia(media, accessToken);
            mediaIds.push(mediaId);
          } catch (error) {
            const linkedInError = await this.handleLinkedInError(error);
            logger.error("Error uploading media:", linkedInError);
            throw new Error(`Failed to upload media: ${linkedInError.message}`);
          }
        }
      }

      // Prepare post content
      const postData = {
        author: `urn:li:person:${socialAccount.providerAccountId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: post.content,
            },
            shareMediaCategory: mediaIds.length > 0 ? "IMAGE" : "NONE",
            media: mediaIds.map((id) => ({
              status: "READY",
              media: id,
              originalUrl: "",
            })),
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      // Publish post
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const linkedInError = await this.handleLinkedInError(error);
      logger.error("Error publishing LinkedIn post:", linkedInError);
      throw linkedInError;
    }
  }

  private async uploadMedia(media: any, accessToken: string) {
    try {
      await this.delayForRateLimit();
      const response = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              owner: `urn:li:person:${media.socialAccount.providerAccountId}`,
              serviceRelationships: [
                {
                  relationshipType: "OWNER",
                  identifier: "urn:li:userGeneratedContent",
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        throw await response.json();
      }

      const uploadData = await response.json();
      const uploadUrl =
        uploadData.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

      // Upload the media file
      await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "image/jpeg",
        },
        body: media.buffer,
      });

      return uploadData.value.asset;
    } catch (error) {
      const linkedInError = await this.handleLinkedInError(error);
      logger.error("Error uploading media to LinkedIn:", linkedInError);
      throw linkedInError;
    }
  }

  public async handleFailedPost(post: any, error: LinkedInError) {
    try {
      // Update post status
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      // Send email notification
      const user = await prisma.user.findUnique({
        where: { id: post.createdById },
      });

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Post Failed - Schedowl",
          template: "post-failed",
          context: {
            postContent: post.content,
            errorMessage: error.message,
            retryCount: post.retryCount + 1,
          },
        });
      }
    } catch (error) {
      logger.error("Error handling failed post:", error);
    }
  }

  static async getAuthUrl(organisationId: string) {
    const state = organisationId; // Consider encrypting this
    const scope = "openid profile email w_member_social";

    return (
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(
        process.env.LINKEDIN_REDIRECT_URI!
      )}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`
    );
  }

  static async handleCallback(code: string, state: string) {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const tokens = tokenResponse.data;

    const userinfo = await axios.get(`${LINKEDIN_API_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const user = userinfo.data;

    try {
      await prisma.socialAccount.create({
        data: {
          type: "LINKEDIN",
          identifier: user.sub,
          name: `${user.given_name} ${user.family_name}`,
          email: user.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          organisationId: state,
          metadata: user,
        },
      });
    } catch (error) {
      console.error("Error saving LinkedIn tokens:", error);
      throw error;
    }

    return tokens;
  }

  static async refreshAccessToken(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.refreshToken) {
      throw new Error("Refresh token not found");
    }

    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const newTokens = response.data;
      await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          accessToken: newTokens.access_token,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      });

      return newTokens.access_token;
    } catch (error) {
      console.error("Error refreshing LinkedIn token:", error);
      throw error;
    }
  }

  static async uploadMedia(accountId: string, media: MediaAttachment) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error("LinkedIn account not found");

    // Check if the access token is expired
    if (new Date() >= new Date(account.expiresAt!)) {
      account.accessToken = await this.refreshAccessToken(accountId);
    }

    try {
      // Step 1: Register media upload
      const registerUpload = await axios.post(
        `${LINKEDIN_API_URL}/assets?action=registerUpload`,
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${account.identifier}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const uploadUrl =
        registerUpload.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      const asset = registerUpload.data.value.asset;

      // Step 2: Upload the media binary
      const mediaResponse = await axios.get(media.url, {
        responseType: "arraybuffer",
      });

      await axios.put(uploadUrl, mediaResponse.data, {
        headers: {
          "Content-Type": media.mimeType,
        },
      });

      return asset;
    } catch (error) {
      console.error("Error uploading media to LinkedIn:", error);
      throw error;
    }
  }

  static async publishPost(
    accountId: string,
    content: string,
    mediaFiles: MediaAttachment[] = []
  ) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error("LinkedIn account not found");

    // Check if the access token is expired
    if (new Date() >= new Date(account.expiresAt!)) {
      account.accessToken = await this.refreshAccessToken(accountId);
    }

    try {
      // Upload media files if any
      const mediaAssets = await Promise.all(
        mediaFiles.map((media) => this.uploadMedia(accountId, media))
      );

      const postData: any = {
        author: `urn:li:person:${account.identifier}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: mediaAssets.length > 0 ? "IMAGE" : "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      // Add media if present
      if (mediaAssets.length > 0) {
        postData.specificContent["com.linkedin.ugc.ShareContent"].media =
          mediaAssets.map((asset) => ({
            status: "READY",
            media: asset,
          }));
      }

      const response = await axios.post(
        `${LINKEDIN_API_URL}/ugcPosts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error publishing to LinkedIn:", error);
      throw error;
    }
  }
}

export const linkedInService = LinkedInService.getInstance();
