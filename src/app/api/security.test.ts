
import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { POST as listeningEventsPost } from "./listening-events/route";
import { GET as playlistsGet } from "./playlists/route";
import { GET as recommendationsGet } from "./recommendations/route";

// Mock next-auth
mock.module("next-auth", () => ({
  getServerSession: async () => null, // Simulate no session
}));

// Mock prisma
mock.module("@/lib/prismadb", () => {
  return {
    prisma: {
      user: {
        findFirst: async () => ({
          id: "mock-user-id",
          email: "mock@example.com",
        }),
        findUnique: async () => ({
          id: "mock-user-id",
          email: "mock@example.com",
        }),
        findMany: async () => [],
        upsert: async () => ({ id: "mock-dev-id", email: "dev@example.com" }),
      },
      track: {
        upsert: async () => ({ id: "mock-track-id" }),
      },
      listeningEvent: {
        create: async () => ({ id: "mock-event-id" }),
        findMany: async () => [],
      },
      likedSong: {
        findMany: async () => [],
      },
      playlist: {
        findMany: async () => [],
      },
      activity: {
        create: async () => ({}),
      }
    },
  };
});

// Mock ytmusic (used in recommendations)
mock.module("@/lib/ytmusic", () => ({
  searchMusic: async () => [],
}));

describe("Security Vulnerability Tests", () => {
  // Ensure we are in a non-production environment where the vulnerability triggers
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Force NODE_ENV to 'development' or 'test' to trigger the vulnerable code path
    // The vulnerability checks: if (!email && process.env.NODE_ENV !== 'production')
    // So 'test' satisfies the condition.
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("POST /api/listening-events should return 401 Unauthorized when not logged in", async () => {
    const req = new NextRequest("http://localhost/api/listening-events", {
      method: "POST",
      body: JSON.stringify({
        videoId: "test-video",
        title: "Test Video",
        artist: "Test Artist",
        playDuration: 10,
        totalDuration: 100,
      }),
    });

    const res = await listeningEventsPost(req);
    // VULNERABLE behavior: Returns 200 because it falls back to first user
    // SECURE behavior: Returns 401
    expect(res.status).toBe(401);
  });

  it("GET /api/playlists should return 401 Unauthorized when not logged in", async () => {
    const req = new NextRequest("http://localhost/api/playlists", {
      method: "GET",
    });

    const res = await playlistsGet();
    // VULNERABLE behavior: Returns 200 (list of playlists for first user/dev user)
    // SECURE behavior: Returns 401
    expect(res.status).toBe(401);
  });

  it("GET /api/recommendations should return generic recommendations when not logged in", async () => {
    const req = new NextRequest("http://localhost/api/recommendations", {
      method: "GET",
    });

    const res = await recommendationsGet(req);
    const data = await res.json();

    // VULNERABLE behavior: personalized: true (because it falls back to first user)
    // SECURE behavior: personalized: false
    expect(data.personalized).toBe(false);
  });
});
