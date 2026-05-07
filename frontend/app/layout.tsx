import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceScribe AI — Audio Transcription & Summarization",
  description:
    "Record or upload audio and get instant AI-powered transcriptions and summaries using Gemini and Whisper.",
  keywords: ["audio transcription", "AI summarization", "Gemini AI", "voice to text"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="gradient-bg min-h-screen">{children}</body>
    </html>
  );
}
