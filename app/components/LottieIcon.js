"use client";

import dynamic from "next/dynamic";

// lottie-web touches `document`, so load it client-side only.
// lottie-react's CJS interop double-wraps the default export, so reach the
// actual component function explicitly.
const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.default.default ?? m.default),
  { ssr: false }
);

export default function LottieIcon({ data, size = 44, loop = true, className }) {
  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
