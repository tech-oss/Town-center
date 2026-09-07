import { BLUE } from "../theme";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg max-w-sm"
      style={{ backgroundColor: BLUE, color: "#fff" }}>
      {message}
    </div>
  );
}
