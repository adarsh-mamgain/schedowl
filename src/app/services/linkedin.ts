import { IntegrationType } from "@/src/enums/integrations";
import { decrypt, encrypt } from "@/src/util/common";
import { supabase } from "@/supabase";
import axios from "axios";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export class LinkedInService {
  static async getAuthUrl(userId: string) {
    const state = userId; // You might want to encrypt this
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
    console.log("Starting handleCallback");
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        }),
      }
    );
    console.log("tokenResponse", tokenResponse);
    console.log("Token response received");

    const tokens = tokenResponse.data;
    console.log("Tokens parsed", tokens);

    // const decryptedState = decrypt(state);
    // if (userId !== decryptedState) {
    //   throw new Error("State does not match user ID");
    // }

    // Store tokens in Supabase
    const { error } = await supabase.from("integrations").upsert({
      user_id: state,
      type: IntegrationType.LinkedIn,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
    });
    console.log("Tokens stored in Supabase");

    if (error) {
      console.error("Error storing tokens in Supabase", error);
      throw error;
    }
    console.log("handleCallback completed successfully");
    return tokens;
  }

  static async post(userId: string, text: string) {
    try {
      const { data: integration, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("type", IntegrationType.LinkedIn)
        .single();

      if (error || !integration) {
        throw new Error("LinkedIn integration not found");
      }

      // Check if token is expired and refresh if needed
      if (new Date(integration.expires_at) < new Date()) {
        await this.refreshToken(userId, integration.refresh_token);
      }

      // Post to LinkedIn
      const response = await axios.post(`${LINKEDIN_API_URL}/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: `urn:li:person:${userId}`,
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
        }),
      });

      if (response.status !== 201) {
        throw new Error("Failed to post to LinkedIn");
      }

      return response.data;
    } catch (error) {
      throw new Error("Failed to post to LinkedIn");
    }
  }

  private static async refreshToken(userId: string, refreshToken: string) {
    // Implement token refresh logic here
  }
}
