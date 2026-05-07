"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileAudio } from "lucide-react";

interface FileUploaderProps {
    onFileSelected: (file: File) => void;
    onTranscribe: () => void;
    disabled?: boolean;
}

const ALLOWED_TYPES = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
const ALLOWED_MIME = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm", "video/webm"];

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileUploader({ onFileSelected, onTranscribe, disabled }: FileUploaderProps) {
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const validateAndSet = useCallback(
        (file: File) => {
            setFileError(null);
            const ext = "." + file.name.split(".").pop()?.toLowerCase();
            const validExt = ALLOWED_TYPES.includes(ext);
            const validMime = ALLOWED_MIME.includes(file.type) || file.type === "";

            if (!validExt) {
                setFileError(`Unsupported format. Please upload: ${ALLOWED_TYPES.join(", ")}`);
                return;
            }
            if (file.size > 25 * 1024 * 1024) {
                setFileError("File too large. Maximum allowed size is 25MB.");
                return;
            }
            setSelectedFile(file);
            onFileSelected(file);
        },
        [onFileSelected]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) validateAndSet(file);
        },
        [validateAndSet]
    );

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSet(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFileError(null);
    };

    return (
        <div className="flex flex-col gap-4 py-6">
            {/* Drop zone */}
            <label
                id="file-drop-zone"
                htmlFor="audio-file-input"
                className={`drop-zone flex flex-col items-center justify-center gap-3 py-12 px-6 cursor-pointer
          ${dragging ? "dragging" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--border-hover)]"}
        `}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={!disabled ? onDrop : undefined}
            >
                <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-[var(--text-primary)]">
                        Drag &amp; drop your audio file
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        or <span className="text-violet-400 underline">browse files</span>
                    </p>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                    Supports: {ALLOWED_TYPES.join(", ")} · Max 25MB
                </p>
                <input
                    id="audio-file-input"
                    type="file"
                    accept={ALLOWED_TYPES.join(",")}
                    className="hidden"
                    onChange={onInputChange}
                    disabled={disabled}
                />
            </label>

            {/* Error */}
            {fileError && (
                <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <X className="w-4 h-4 shrink-0" />
                    {fileError}
                </div>
            )}

            {/* Selected file info */}
            {selectedFile && !fileError && (
                <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileAudio className="w-5 h-5 text-violet-400 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {formatBytes(selectedFile.size)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearFile}
                        className="text-[var(--text-secondary)] hover:text-red-400 transition-colors shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Transcribe button */}
            <button
                id="transcribe-btn"
                onClick={onTranscribe}
                disabled={!selectedFile || !!fileError || disabled}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
                <Upload className="w-4 h-4" />
                Transcribe Audio
            </button>
        </div>
    );
}
