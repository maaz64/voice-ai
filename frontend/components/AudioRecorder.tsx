"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  onAudioReady: (file: File) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onAudioReady, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speech/silence detection (VAD-lite)
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);

  const lastNonSilentAtRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false);
  const discardOnStopRef = useRef<boolean>(false);
  const stoppingRef = useRef<boolean>(false);

  const SILENCE_MS = 5_000;
  const RMS_THRESHOLD = 0.03;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cleanup = useCallback(() => {
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current);
    vadRafRef.current = null;

    analyserRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    mediaRecorderRef.current = null;
    stoppingRef.current = false;
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    try {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {
      cleanup();
    } finally {
      setIsRecording(false);
    }
  }, [cleanup]);

  const startVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const buffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        return;
      }

      analyser.getByteTimeDomainData(buffer);

      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buffer.length);

      const now = Date.now();
      if (rms >= RMS_THRESHOLD) {
        lastNonSilentAtRef.current = now;
        hasSpokenRef.current = true;
      }

      // If no speech detected for 15 seconds, stop + discard
      if (now - lastNonSilentAtRef.current >= SILENCE_MS) {
        discardOnStopRef.current = !hasSpokenRef.current;
        stopRecording();
        return;
      }

      vadRafRef.current = requestAnimationFrame(tick);
    };

    vadRafRef.current = requestAnimationFrame(tick);
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        try {
          if (!discardOnStopRef.current) {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const file = new File([blob], `recording-${Date.now()}.webm`, {
              type: mimeType,
            });
            onAudioReady(file);
          }
        } finally {
          cleanup();
        }
      };

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const now = Date.now();
      lastNonSilentAtRef.current = now;
      hasSpokenRef.current = false;
      discardOnStopRef.current = false;
      stoppingRef.current = false;

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      startVadLoop();
    } catch {
      alert(
        "Microphone access denied. Please allow microphone access in your browser."
      );
    }
  }, [cleanup, onAudioReady, startVadLoop]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Record button */}
      <div className="relative">
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
        )}
        <button
          id="record-btn"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 font-semibold shadow-lg
            ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/40"
                : "bg-gradient-to-br from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 shadow-violet-500/30"
            }
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 cursor-pointer"
            }
          `}
        >
          {isRecording ? (
            <Square className="w-9 h-9 text-white fill-white" />
          ) : (
            <Mic className="w-9 h-9 text-white" />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-semibold text-sm tracking-wide uppercase">
                Recording
              </span>
            </div>
            <span
              id="recording-timer"
              className="text-3xl font-mono font-bold text-white tabular-nums"
            >
              {formatTime(elapsed)}
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Auto-stops after 15s of silence
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <p className="text-[var(--text-secondary)] text-sm">
              Click to start recording from your microphone
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
