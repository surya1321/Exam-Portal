"use client";

import { useEffect, useRef, useState } from "react";

type CameraProctorProps = {
  mediaStream: MediaStream | null;
};

export function CameraProctor({ mediaStream }: CameraProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoActive, setVideoActive] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
      setVideoActive(true);
    } else {
      videoRef.current.srcObject = null;
      setVideoActive(false);
    }
  }, [mediaStream]);

  return (
    <div className="fixed bottom-4 right-4 z-40 overflow-hidden rounded-xl border border-border shadow-2xl max-[480px]:bottom-2 max-[480px]:right-2">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 bg-black/90 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
        </div>
        <span className="text-[10px] text-zinc-400">Proctored</span>
      </div>

      {/* Video feed */}
      <div className="relative bg-black">
        {!videoActive && (
          <div className="h-28 w-40 max-[480px]:h-20 max-[480px]:w-28 flex flex-col items-center justify-center bg-zinc-900 gap-2">
            <span className="material-symbols-outlined text-zinc-500 text-[28px]">videocam_off</span>
            <span className="text-[10px] text-zinc-500">Camera disconnected</span>
          </div>
        )}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-28 w-40 max-[480px]:h-20 max-[480px]:w-28 object-cover [transform:scaleX(-1)] ${!videoActive ? "hidden" : ""}`}
          aria-label="Camera proctoring feed"
        />
      </div>

      {/* Footer - monitoring text */}
      <div className="flex items-center justify-center gap-1.5 bg-black/90 px-3 py-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-[pulse_2s_ease-in-out_infinite]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[9px] text-zinc-400 tracking-wide">Exam is being monitored</span>
      </div>
    </div>
  );
}
