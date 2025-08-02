import { NextResponse } from "next/server";

import { promises as fs } from "fs";
import path from "path";
import os from "os";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – no types for node-webvtt
// import webvtt from "node-webvtt";

// import ytdlp from "youtube-dl-exec";
import { create as createYoutubeDl } from "youtube-dl-exec";
const ytdlp = createYoutubeDl(path.join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp"));

export async function POST(request: Request) {

    // console.log("aslkdjfa");
    // return NextResponse.json({ error: "Not implemented" }, { status: 501 });
    try {
        const { url } = await request.json();
        if (!url) {
        return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        }

        const tmpDir = os.tmpdir();
        const before = new Set(await fs.readdir(tmpDir));

        const outTemplate = path.join(tmpDir, `subs-${Date.now()}-%(title)s.%(ext)s`);

        // const tmpVtt = path.join(os.tmpdir(), `subs-${Date.now()}.%(ext)s`);
        // const tmpVtt = path.join(os.tmpdir(), "%(title)s.%(ext)s");
        await ytdlp(url, {
        skipDownload: true,
        writeAutoSub: true,
        subLang: "en.*,en",
        subFormat: "vtt",
        // output: outTemplate,
        writeSub: true,
        // verbose: false,
        });

        const after = await fs.readdir(tmpDir);
        // console.log(after);
        const newVtts = after.filter(f => f.endsWith(".vtt") && !before.has(f)).map(f => path.join(tmpDir, f));

        // console.log(newVtts);
        const binPath = path.join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp");
        console.log("yt-dlp bin:", binPath);
        const ver = await ytdlp("--version");
        console.log("yt-dlp version:", ver);

        // console.log(outTemplate);
        if(newVtts.length === 0) {
            throw new Error("yt-dlp produced no VTT subtitles");
        }

        const vttWithTimes = await Promise.all(
            newVtts.map(async p => ({
                path: p,
                mtime: (await fs.stat(p)).mtimeMs,
            }))
        );

        vttWithTimes.sort((a, b) => b.mtime - a.mtime);

        const vttPath = vttWithTimes[0].path;

        const vttRaw = await fs.readFile(vttPath, "utf8");
        // cleanup subtitle file so future runs work
        await fs.unlink(vttPath);
        return NextResponse.json({ transcript: vttRaw })
    } catch (err: any) {
        console.error("Transcript error:", err);

        // Construct a more informative message
        const message = err.code
        ? `${err.code}: ${err.message}`
        : err.toString();

        // In development only: include the stack trace
        const responsePayload: any = { error: message };
        if (process.env.NODE_ENV !== "production") {
        responsePayload.stack = err.stack; }

            console.error("Transcript error:", err);


    }
}