export default function MobileCard({ children, className = "", style, onClick, id }) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-2xl ${className}`}
      style={{ boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)", ...style }}
    >
      {children}
    </div>
  );
}
