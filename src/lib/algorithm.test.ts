import { describe, expect, test, setSystemTime, beforeEach, afterEach } from "bun:test";
import { getTimeContextQuery } from "./algorithm";

describe("getTimeContextQuery", () => {
    beforeEach(() => {
        // Reset to a known safe default before each test
        setSystemTime(new Date("2024-01-01T12:00:00"));
    });

    afterEach(() => {
        setSystemTime(); // Reset to real system time
    });

    test("should return 'morning energy music' between 05:00 and 11:59", () => {
        setSystemTime(new Date("2024-01-01T05:00:00"));
        expect(getTimeContextQuery()).toBe("morning energy music");

        setSystemTime(new Date("2024-01-01T11:59:59"));
        expect(getTimeContextQuery()).toBe("morning energy music");
    });

    test("should return 'daytime vibes music' between 12:00 and 17:59", () => {
        setSystemTime(new Date("2024-01-01T12:00:00"));
        expect(getTimeContextQuery()).toBe("daytime vibes music");

        setSystemTime(new Date("2024-01-01T17:59:59"));
        expect(getTimeContextQuery()).toBe("daytime vibes music");
    });

    test("should return 'evening chill music' between 18:00 and 21:59", () => {
        setSystemTime(new Date("2024-01-01T18:00:00"));
        expect(getTimeContextQuery()).toBe("evening chill music");

        setSystemTime(new Date("2024-01-01T21:59:59"));
        expect(getTimeContextQuery()).toBe("evening chill music");
    });

    test("should return 'late night lo-fi music' during late night/early morning hours", () => {
        // Late night: 22:00 - 23:59
        setSystemTime(new Date("2024-01-01T22:00:00"));
        expect(getTimeContextQuery()).toBe("late night lo-fi music");

        setSystemTime(new Date("2024-01-01T23:59:59"));
        expect(getTimeContextQuery()).toBe("late night lo-fi music");

        // Early morning: 00:00 - 04:59
        setSystemTime(new Date("2024-01-01T00:00:00"));
        expect(getTimeContextQuery()).toBe("late night lo-fi music");

        setSystemTime(new Date("2024-01-01T04:59:59"));
        expect(getTimeContextQuery()).toBe("late night lo-fi music");
    });
});
