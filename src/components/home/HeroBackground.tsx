"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useSyncExternalStore } from "react";
import { useInView, useReducedMotion } from "motion/react";

// three.js (~150kb gz) stays out of the first-paint bundle; the static
// navy-deep hero background is the fallback while loading and for
// reduced-motion / no-WebGL visitors.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const emptySubscribe = () => () => {};
let webglSupport: boolean | null = null;
function detectWebgl() {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(
        canvas.getContext("webgl2") || canvas.getContext("webgl")
      );
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

export default function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(containerRef, { amount: 0.05 });
  const webglOk = useSyncExternalStore(emptySubscribe, detectWebgl, () => false);
  const [ready, setReady] = useState(false);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`absolute inset-0 transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      {webglOk && !reducedMotion && (
        <HeroCanvas active={inView} onReady={() => setReady(true)} />
      )}
    </div>
  );
}
