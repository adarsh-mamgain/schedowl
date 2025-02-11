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

    const userinfo = await axios.get(`${LINKEDIN_API_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const user = userinfo.data;

    try {
      await prisma.linkedInAccount.create({
        data: {
          sub: user.sub,
          givenName: user.given_name,
          familyName: user.family_name,
          organisationId: state,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
        },
      });
    } catch (error) {
      console.error("Error during prisma.linkedInAccount.create:", error);
      throw error;
    }

    return tokens;
  }

  static async post() {
    try {
      const now = new Date();
      const posts = await prisma.post.findMany({
        where: {
          status: "SCHEDULED",
          scheduledFor: { lte: now },
        },
        include: { linkedInAccount: true },
      });

      for (const post of posts) {
        if (!post.linkedInAccount) continue;
        try {
          await axios.post(
            `${LINKEDIN_API_URL}/ugcPosts`,
            {
              author: `urn:li:person:${post.linkedInAccount.sub}`,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text: post.content },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
              },
            },
            {
              headers: {
                Authorization: `Bearer ${post.linkedInAccount.accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          await prisma.post.update({
            where: { id: post.id },
            data: { status: "PUBLISHED", publishedAt: new Date() },
          });
        } catch (error) {
          console.error("Error publishing post:", error);
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "FAILED", errorMessage: error! },
          });
        }
      }

      return true;
    } catch {
      throw new Error("Failed to post to LinkedIn");
    }
  }
}
