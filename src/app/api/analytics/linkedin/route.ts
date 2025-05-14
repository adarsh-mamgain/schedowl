import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

type LinkedInCacheData = {
  success: true;
  message: string;
  data: [
    {
      isBrandPartnership: boolean;
      text: string;
      totalReactionCount: number;
      likeCount: number;
      empathyCount: number;
      praiseCount: number;
      commentsCount: number;
      repostsCount: number;
      postedAt: string;
      postedDate: string;
      postedDateTimestamp: number;
      mentions: [
        {
          firstName: string;
          lastName: string;
        },
        {
          firstName: string;
          lastName: string;
        }
      ];
      companyMentions: [
        {
          name: string;
        }
      ];
    }
  ];
};

// Singleton class to handle cache data
class LinkedInCache {
  private static instance: LinkedInCache;
  private cacheData: LinkedInCacheData | null = null;
  private lastModified: number = 0;
  private readonly CACHE_FILE_PATH: string;
  private readonly CACHE_REFRESH_INTERVAL: number = 24 * 60 * 60 * 1000; // 1 day

  private constructor() {
    // Use src directory as base path
    this.CACHE_FILE_PATH = path.join(
      process.cwd(),
      "src/app/api/analytics/linkedin/cache.json"
    );
    this.loadCache();
  }

  public static getInstance(): LinkedInCache {
    if (!LinkedInCache.instance) {
      LinkedInCache.instance = new LinkedInCache();
    }
    return LinkedInCache.instance;
  }

  private loadCache(): void {
    try {
      // Check if file exists before trying to read it
      if (!fs.existsSync(this.CACHE_FILE_PATH)) {
        console.warn(
          `Cache file not found at ${this.CACHE_FILE_PATH}, using default cache data`
        );
        return;
      }

      const stats = fs.statSync(this.CACHE_FILE_PATH);
      this.lastModified = stats.mtimeMs;
      const fileContent = fs.readFileSync(this.CACHE_FILE_PATH, "utf8");
      const parsedData = JSON.parse(fileContent);

      // Validate cache data structure
      if (this.isValidCacheData(parsedData)) {
        this.cacheData = parsedData;
      } else {
        console.warn("Invalid cache data structure, using default cache data");
      }
    } catch (error) {
      console.error("Error loading cache:", error);
      // Keep using default cache data
    }
  }

  private isValidCacheData(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      "success" in data &&
      "data" in data &&
      Array.isArray(data.data)
    );
  }

  private shouldRefreshCache(): boolean {
    if (!this.lastModified) return true;
    return Date.now() - this.lastModified > this.CACHE_REFRESH_INTERVAL;
  }

  public getCacheData(): any {
    if (this.shouldRefreshCache()) {
      this.loadCache();
    }
    return this.cacheData;
  }
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const cache = LinkedInCache.getInstance();

  // If no username is provided, return cache data
  if (!username) {
    return NextResponse.json(cache.getCacheData());
  }

  try {
    const response = await fetch(
      `https://linkedin-data-api.p.rapidapi.com/get-profile-posts?username=${username}`,
      {
        headers: {
          "x-rapidapi-host": "linkedin-data-api.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPID_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      // If API fails, return cache data as fallback
      console.warn("LinkedIn API failed, using cache data as fallback");
      return NextResponse.json(cache.getCacheData());
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // If any error occurs, return cache data as fallback
    console.error("Error fetching LinkedIn data:", error);
    return NextResponse.json(cache.getCacheData());
  }
}
