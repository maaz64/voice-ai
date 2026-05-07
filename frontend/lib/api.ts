import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TranscribeResult {
    transcript: string;
    summary: string;
    duration_seconds: number;
    provider_used: string;
}

export async function transcribeAudio(
    file: File,
    provider: "gemini" | "huggingface" = "gemini"
): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);

    const response = await axios.post<TranscribeResult>(
        `${API_URL}/api/transcribe`,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000, // 2 min timeout for large files
        }
    );

    return response.data;
}
