import { useEffect, useState } from "react";

// Curated reels shown on the homepage — self-hosted thumbnail + video files
// (public/images/instagram) so playback never depends on Instagram's
// short-lived, signed CDN links expiring. To swap a post, replace the three
// asset files for that slot and update the fields below.
const USERNAME = "visitmaidenhead";
const AVATAR = "/images/instagram/avatar.jpg";

const POSTS = [
  {
    url: "https://www.instagram.com/reel/Dbnc_fFRSSe/",
    thumb: "/images/instagram/reel-1.jpg",
    video: "/images/instagram/reel-1.mp4",
    caption: "Lifestyle. Happy. Relax. Live.",
    hashtags: "#maidenhead #life #foodie #exciting #live",
  },
  {
    url: "https://www.instagram.com/reel/DbYNnf4tDGe/",
    thumb: "/images/instagram/reel-2.jpg",
    video: "/images/instagram/reel-2.mp4",
    caption: "Future. Exciting. Living.",
    hashtags: "#maidenhead #nicholsonquarter #regeneration #exciting #somethingiscoming",
  },
  {
    url: "https://www.instagram.com/reel/Db0TCO7IrQ2/",
    thumb: "/images/instagram/reel-3.jpg",
    video: "/images/instagram/reel-3.mp4",
    caption: "Cocktails. Relax. Happy. Live.",
    hashtags: "#maidenhead #cocktails #signaturecocktails #mixology #raiseaglass",
  },
];

const PlayIcon = (props) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

// ── Lightbox — video plays on the left, caption/profile on the right,
// matching the reference layout exactly. Arrow keys / on-screen arrows step
// between the three posts; Escape or a backdrop click closes it. ──
function Lightbox({ index, onClose, onStep }) {
  const post = POSTS[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:opacity-70 transition-opacity z-10"
        style={{ fontSize: 26, lineHeight: 1 }}
      >
        ✕
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onStep(-1); }}
        aria-label="Previous post"
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white transition-colors hover:bg-white/10"
        style={{ fontSize: 22 }}
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onStep(1); }}
        aria-label="Next post"
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white transition-colors hover:bg-white/10"
        style={{ fontSize: 22 }}
      >
        ›
      </button>

      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-xl flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="w-full md:w-[52%] shrink-0 bg-black flex items-center justify-center">
          <video
            key={post.url}
            src={post.video}
            poster={post.thumb}
            controls
            autoPlay
            loop
            playsInline
            className="w-full h-full max-h-[50vh] md:max-h-[92vh] object-contain"
          />
        </div>

        {/* Caption panel */}
        <div className="w-full md:w-[48%] flex flex-col p-6">
          <div className="flex items-center gap-3 mb-5">
            <img src={AVATAR} alt={USERNAME} className="w-9 h-9 rounded-full object-cover shrink-0" />
            <a
              href={`https://www.instagram.com/${USERNAME}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm hover:opacity-70 transition-opacity"
              style={{ color: "#000000" }}
            >
              @{USERNAME}
            </a>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: "#000000" }}>
            <span className="font-semibold">{USERNAME}</span> {post.caption}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--sage)" }}>
            {post.hashtags}
          </p>

          <div
            className="mt-auto pt-4 flex items-center gap-3 text-xs"
            style={{ color: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            <span>{index + 1} / {POSTS.length}</span>
            <span>|</span>
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
              View on Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstagramFeed() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-14 md:py-16 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
            Follow Along
          </p>
          <h2 className="hero-title uppercase text-3xl md:text-5xl" style={{ color: "#000000" }}>
            On Instagram
          </h2>
        </div>

        {/* Bare thumbnail grid — just the photo and a play icon, nothing else */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {POSTS.map((post, i) => (
            <button
              key={post.url}
              onClick={() => setOpenIndex(i)}
              aria-label="Play Instagram post"
              className="group relative aspect-square overflow-hidden bg-black cursor-pointer"
            >
              <img
                src={post.thumb}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center transition-colors duration-200 group-hover:bg-black/10">
                <PlayIcon />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <a
            href={`https://www.instagram.com/${USERNAME}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
            style={{ color: "#000000" }}
          >
            Follow us on Instagram
            <span>→</span>
          </a>
        </div>
      </div>

      {openIndex !== null && (
        <Lightbox
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onStep={(delta) => setOpenIndex((i) => (i + delta + POSTS.length) % POSTS.length)}
        />
      )}
    </section>
  );
}
