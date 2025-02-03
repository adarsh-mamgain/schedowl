import { SocialPlatform } from "@/src/enums/social-platoform";
import prisma from "@/src/lib/prisma";
import axios from "axios";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export class LinkedInService {
  static async getAuthUrl(organisationId: string) {
    const state = organisationId; // You might want to encrypt this
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
    console.log("state", state);
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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const tokens = tokenResponse.data;

    try {
      await prisma.socialAccount.create({
        data: {
          organisationId: state,
          platform: SocialPlatform.LINKEDIN,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
        },
      });
    } catch (error) {
      console.error("Error during prisma.integration.create:", error);
      throw error;
    }

    return tokens;
  }

  static async post(integrationId: string, text: string) {
    try {
      const integration = await prisma.socialAccount.findFirst({
        where: {
          id: integrationId,
          platform: SocialPlatform.LINKEDIN,
        },
      });

      if (!integration) {
        throw new Error("LinkedIn integration not found");
      }

      // Check if token is expired and refresh if needed
      // if (new Date(integration.expires_at) < new Date()) {
      //   await this.refreshToken(userId, integration.refresh_token);
      // }

      //! Post to LinkedIn
      const response = await axios.post(
        `${LINKEDIN_API_URL}/ugcPosts`,
        {
          author: `urn:li:person:${8675309}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to post to LinkedIn");
      }

      return response.data;
    } catch {
      throw new Error("Failed to post to LinkedIn");
    }
  }

  // private static async refreshToken(userId: string, refreshToken: string) {
  //   // Implement token refresh logic here
  // }
}
