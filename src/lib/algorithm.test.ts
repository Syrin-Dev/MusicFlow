import { expect, test, describe } from "bun:test";
import { cleanArtist } from "./algorithm";

describe("cleanArtist", () => {
    describe("Standard Behavior", () => {
        test("should keep standard artist names unchanged", () => {
            expect(cleanArtist("The Weeknd")).toBe("The Weeknd");
            expect(cleanArtist("Daft Punk")).toBe("Daft Punk");
            expect(cleanArtist("Taylor Swift")).toBe("Taylor Swift");
        });
    });

    describe("Suffix Removal: ' - Topic'", () => {
        test("should remove ' - Topic' suffix", () => {
            expect(cleanArtist("Metallica - Topic")).toBe("Metallica");
            expect(cleanArtist("The Beatles - Topic")).toBe("The Beatles");
        });

        test("should remove ' - Topic' case insensitively", () => {
            expect(cleanArtist("Artist - topic")).toBe("Artist");
            expect(cleanArtist("Artist - TOPIC")).toBe("Artist");
        });

        test("should NOT remove ' - Topic' if not at the end", () => {
            // Ensures we don't accidentally mangle names with similar patterns in the middle
            expect(cleanArtist("The - Topic Debate")).toBe("The - Topic Debate");
        });
    });

    describe("Suffix Removal: 'VEVO'", () => {
        test("should remove 'VEVO' suffix attached to name", () => {
            expect(cleanArtist("RihannaVEVO")).toBe("Rihanna");
            expect(cleanArtist("JustinBieberVEVO")).toBe("JustinBieber");
        });

        test("should remove 'VEVO' suffix with space", () => {
            expect(cleanArtist("Artist VEVO")).toBe("Artist");
        });

        test("should NOT remove 'vevo' if part of the name (not suffix)", () => {
            // "Davevo" is a plausible name or username
            expect(cleanArtist("Davevo")).toBe("Davevo");
            expect(cleanArtist("VevoUser")).toBe("VevoUser");
        });
    });

    describe("Removal: 'Official' & 'Official Channel'", () => {
        test("should remove 'Official Channel' phrase", () => {
            expect(cleanArtist("Artist Official Channel")).toBe("Artist");
        });

        test("should remove 'Official' as a whole word", () => {
            expect(cleanArtist("Artist Official")).toBe("Artist");
            expect(cleanArtist("Official Artist")).toBe("Artist");
        });

        test("should NOT remove 'Official' if part of another word", () => {
            expect(cleanArtist("The Officials")).toBe("The Officials");
            expect(cleanArtist("Unofficially")).toBe("Unofficially");
        });
    });

    describe("Complex Combinations", () => {
        test("should handle multiple cleanup rules", () => {
            // "ArtistVEVO - Topic" -> remove Topic -> "ArtistVEVO" -> remove VEVO -> "Artist"
            expect(cleanArtist("ArtistVEVO - Topic")).toBe("Artist");
        });

        test("should handle Official Channel with Topic", () => {
            // "Artist Official Channel - Topic" -> remove Topic -> "Artist Official Channel" -> remove Phrase -> "Artist"
            expect(cleanArtist("Artist Official Channel - Topic")).toBe("Artist");
        });
    });

    describe("Edge Cases", () => {
        test("should return empty string for empty input", () => {
            expect(cleanArtist("")).toBe("");
        });

        test("should return empty string for whitespace input", () => {
            expect(cleanArtist("   ")).toBe("");
        });

        test("should handle null/undefined gracefully (if invoked from JS)", () => {
            // @ts-ignore
            expect(cleanArtist(null)).toBe("");
            // @ts-ignore
            expect(cleanArtist(undefined)).toBe("");
        });
    });
});
