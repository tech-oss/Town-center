import { coordsError, coordsWarning } from "../../lib/geo";

// Shown under latitude/longitude inputs. Red means the save will be refused;
// amber means the pin is valid but a long way from Maidenhead.
export default function CoordsNotice({ lat, lng }) {
  const error = coordsError(lat, lng);
  const warning = error ? null : coordsWarning(lat, lng);
  if (!error && !warning) return null;
  return (
    <p className="text-xs px-3 py-2 rounded-lg mt-2" role={error ? "alert" : undefined}
      style={error
        ? { backgroundColor: "rgba(220,38,38,0.08)", color: "#B91C1C" }
        : { backgroundColor: "rgba(217,119,6,0.1)", color: "#92400E" }}>
      {error ?? warning}
    </p>
  );
}
