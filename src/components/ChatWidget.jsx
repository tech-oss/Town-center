import { useEffect } from "react";

const SCRIPT_SRC = "https://elfsightcdn.com/platform.js";
const WIDGET_CLASS = "elfsight-app-481a9219-6809-4446-9b60-f85c04317d8c";

// Elfsight AI Chatbot. The platform script is loaded once (guarded against
// StrictMode's double-invoke and repeat mounts) and renders its own
// responsive, self-positioning floating bubble — no extra layout needed on
// our side for it to sit correctly on both desktop and mobile.
export default function ChatWidget() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div className={WIDGET_CLASS} data-elfsight-app-lazy />;
}
