import { useState } from "react";
import { createPortal } from "react-dom";

// Full-screen photo viewer — tap a thumbnail to open, tap either half of the
// image (or the arrows) to step, swipe-free since a tap zone covers the
// whole screen on mobile. Same role as the website's GalleryLightbox.
function Lightbox({ images, index, onClose, onStep }) {
  return createPortal(
    <div className="fixed inset-0 z-[3000] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.96)" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <span className="text-xs font-bold text-white/80">{index + 1} / {images.length}</span>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M6 18 18 6" /></svg>
        </button>
      </div>
      <div className="relative flex-1 flex items-center justify-center">
        <img src={images[index]} alt="" className="max-w-full max-h-full object-contain" />
        {images.length > 1 && (
          <>
            <button onClick={() => onStep(-1)} aria-label="Previous photo" className="absolute left-0 top-0 bottom-0 w-1/3" />
            <button onClick={() => onStep(1)} aria-label="Next photo" className="absolute right-0 top-0 bottom-0 w-1/3" />
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// Extra-photos grid (2 per row) shown on every business/stay detail screen,
// matching the website's photo grid — tapping any photo opens it full screen
// with the rest of the set swipeable via tap zones either side.
export default function PhotoGallery({ images = [], title, max = 6 }) {
  const [index, setIndex] = useState(null);
  const shown = images.slice(0, max);
  if (shown.length === 0) return null;

  return (
    <div>
      <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Photos</p>
      <div className="grid grid-cols-2 gap-2">
        {shown.map((src, i) => (
          <button key={i} type="button" onClick={() => setIndex(i)} className="aspect-square overflow-hidden rounded-xl">
            <img src={src} alt={`${title ?? ""} ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {index !== null && (
        <Lightbox
          images={shown}
          index={index}
          onClose={() => setIndex(null)}
          onStep={(delta) => setIndex((i) => (i + delta + shown.length) % shown.length)}
        />
      )}
    </div>
  );
}
