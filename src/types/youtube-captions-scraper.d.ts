declare module 'youtube-captions-scraper' {
    interface SubtitleOptions {
        videoID: string;
        lang?: string;
    }

    interface Subtitle {
        start: string;
        dur: string;
        text: string;
    }

    export function getSubtitles(options: SubtitleOptions): Promise<Subtitle[]>;
}
