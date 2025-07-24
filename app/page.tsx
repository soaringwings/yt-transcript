"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConvert() {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }
    setLoading(true);
    setError("");
    // console.log("lsakdjflasdfj");
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const text = await res.text();
      console.log("Raw API response:", text);
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError("Invalid server response");
        return;
      }
      if (!res.ok) {
        setError(data.error || res.statusText);
        return;
      }
      if (data.transcript) {
        setTranscript(data.transcript);
      } else {
        setError("No transcript found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube Transcript Converter</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          aria-label="YouTube video URL"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border rounded-md px-3 py-2 w-64"
        />
        <button
          onClick={handleConvert}
          disabled={loading}
          className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {loading ? "Converting…" : "Convert"}
        </button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {transcript && (
        <pre className="whitespace-pre-wrap bg-[#18181b] text-gray-100 p-4 rounded-lg w-full max-w-2xl border border-gray-700 shadow-md">
          {transcript}
        </pre>
      )}
    </main>
  );
}