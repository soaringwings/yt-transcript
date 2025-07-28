// import { NextResponse } from "next/server";
// import ytdlp from "youtube-dl-exec";
// import { promises as fs } from "fs";
// import path from "path";
// import os from "os";
// // import WebVTT from "webvtt";
// import webvtt from "node-webvtt";

// export async function POST(request: Request) {
//     const { url } = await request.json();
//     if(!url) return NextResponse.json({ error: "URL: missing" }, { status: 400 });

//     const tmpVtt = path.join(os.tmpdir(), `subs-${Date.now()}.%(ext)s`);
// // run yt-dlp 
//     await ytdlp(url, {
//         skipDownload: true,
//         writeAutoSub: true,
//         subLang: "en",
//         subFormat: "vtt",
//         output: tmpVtt,
//         verbose: false,
//     });

//     const vttPath = tmpVtt.replace("%(ext)s", "en.vtt");
//     const vttRaw = await fs.readFile(vttPath, "utf8");
//     await fs.unlink(vttPath);

//     // const cues = WebVTT.parse(vttRaw).cues.map(c => c.text).join("\n");
//     const cues = (webvtt.parse(vttRaw).cues as Array<{ text: string }>).map((c) => c.text).join("\n");

//     return NextResponse.json({ transcript: cues });
// }
// File created at /Users/edward/my-app/types/node-webvtt.d.ts
// declare module 'node-webvtt';
// app/api/transcript/route.ts
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
        const tmpVtt = path.join(os.tmpdir(), `subs-${Date.now()}.%(ext)s`);
        // const tmpVtt = path.join(os.tmpdir(), "%(title)s.%(ext)s");
        await ytdlp(url, {
        skipDownload: true,
        writeAutoSub: true,
        subLang: "en",
        subFormat: "vtt",
        writeSub: true,
        output: tmpVtt,
        // verbose: false,
        });
        console.log(await fs.readdir(os.tmpdir()));
        // const tmpDir = os.tmpdir();
        // const files = await fs.readdir(tmpDir);
        // console.log(files);
        console.log(tmpVtt);

        const manual = tmpVtt.replace("%(ext)s", "en.vtt");
        const auto = tmpVtt.replace("%(ext)s", "auto.en.vtt");
        // console.log(vttPath);

        let vttRaw: string;
        try {
            vttRaw = await fs.readFile(manual, "utf8");
        } catch (err: any) {
            vttRaw = await fs.readFile(auto, "utf8");
            console.error(err);
        }

        try { await fs.unlink(manual); } catch {}
        try { await fs.unlink(auto); } catch {}
        // const vttRaw = await fs.readFile(`${tmpDir}/Me\ at\ the\ zoo.en.vtt`, "utf8");
        // const vttRaw = await fs.readFile(`${vttPath}`, "utf8");
        // await fs.unlink(vttPath);

        // const cues = (webvtt.parse(vttRaw).cues as Array<{ text: string }>).map(c => c.text).join("\n");
        // return NextResponse.json({ transcript: cues });
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