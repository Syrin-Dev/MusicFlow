import { describe, expect, it, mock, beforeAll, afterEach } from "bun:test";

// Mocks need to be defined before module is imported
const mockGetSearchSuggestions = mock(() => Promise.resolve([]));
const mockInitialize = mock(() => Promise.resolve());

// Mock the ytmusic-api module
mock.module("ytmusic-api", () => {
  return {
    default: class YTMusic {
      initialize = mockInitialize;
      getSearchSuggestions = mockGetSearchSuggestions;
    }
  };
});

describe("getSuggestions", () => {
  let getSuggestions: (query: string) => Promise<string[]>;

  beforeAll(async () => {
    // Dynamic import ensures the mock is used when the module is loaded
    const importedModule = await import("./ytmusic");
    getSuggestions = importedModule.getSuggestions;
  });

  afterEach(() => {
    mockGetSearchSuggestions.mockClear();
    mockInitialize.mockClear();
  });

  it("should return suggestions on success", async () => {
    const suggestions = ["suggestion 1", "suggestion 2"];
    mockGetSearchSuggestions.mockResolvedValue(suggestions);

    const result = await getSuggestions("test query");

    // Initialize might be called, or skipped if already initialized
    // We primarily care that the search happens
    expect(mockGetSearchSuggestions).toHaveBeenCalledWith("test query");
    expect(result).toEqual(suggestions);
  });

  it("should return empty array on error", async () => {
    mockGetSearchSuggestions.mockRejectedValue(new Error("API Error"));

    const result = await getSuggestions("error query");

    expect(mockGetSearchSuggestions).toHaveBeenCalledWith("error query");
    expect(result).toEqual([]);
  });
});
