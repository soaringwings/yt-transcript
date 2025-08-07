import { NextResponse } from "next/server";
import path from "node:path";
import { create as createYoutubeDl } from "youtube-dl-exec";

const ytdlp = createYoutubeDl(
  path.join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp")
);

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // 1. get metadata only
    const raw = await ytdlp(url, { dumpJson: true, skipDownload: true, convertSubs: "vtt" });
    const meta = typeof raw === "string" ? JSON.parse(raw) : raw;

    // 2. pick English captions (manual > auto)
    const pick = (obj: any) => {
      if (!obj) return null;
      const key = Object.keys(obj).find(k => /^en(-|$)/.test(k));
      return key ? obj[key] : null;
    };

    const tracks =
      pick(meta.subtitles) ||
      pick(meta.automatic_captions);

    if (!tracks) {
      return NextResponse.json(
        { error: "No English captions available" },
        { status: 404 }
      );
    }

    const vttTrack =
      tracks.find((t: any) => t.ext === "vtt") || tracks[0];

    // 3. download the VTT into memory
    const res = await fetch(vttTrack.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch caption URL (HTTP ${res.status})`);
    }
    const vttRaw = await res.text();

    // 4. return it
    return NextResponse.json({ transcript: vttRaw });
  } catch (err: any) {
    console.error("Transcript error:", err);
    const payload: any = {
      error: err?.message || err?.toString() || "Unknown server error",
    };
    if (process.env.NODE_ENV !== "production" && err?.stack) {
      payload.stack = err.stack;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}