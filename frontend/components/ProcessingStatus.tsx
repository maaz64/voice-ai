"use client";

import { Loader2, Brain } from "lucide-react";

interface ProcessingStatusProps {
    message?: string;
}

export default function ProcessingStatus({
    message = "Processing your audio...",
}: ProcessingStatusProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-16 fade-in">
            {/* Animated icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Brain className="w-9 h-9 text-violet-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/40 border-t-violet-400 animate-spin" />
            </div>

            {/* Text */}
            <div className="text-center flex flex-col gap-2">
                <p className="font-semibold text-[var(--text-primary)]">{message}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                    This may take a moment depending on audio length
                </p>
            </div>

            {/* Shimmer skeleton preview */}
            <div className="w-full max-w-2xl flex flex-col gap-3 px-2">
                {[100, 90, 80, 70, 60].map((w, i) => (
                    <div
                        key={i}
                        className="shimmer h-3 rounded-full"
                        style={{ width: `${w}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
