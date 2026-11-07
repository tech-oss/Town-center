import { lazy, Suspense } from "react";
import WhenVisible from "./WhenVisible";

// The map itself (LocationMapView) and its map engine load only as the map
// nears the screen; until then its box holds the space, so nothing shifts.
const LocationMapView = lazy(() => import("./LocationMapView"));

function MapSpace({ heading = "Location", note, rounded = true, width = "100%", widthClassName, aspectClassName = "aspect-[16/9] md:aspect-[21/9]" }) {
  return (
    <div>
      {heading && <h2 className="section-heading text-2xl md:text-3xl font-bold mb-2" style={{ color: "#000000" }}>{heading}</h2>}
      {heading && note && <p className="text-base mb-6" style={{ color: "#000000" }}>{note}</p>}
      <div
        className={`relative overflow-hidden ${aspectClassName} ${rounded ? "rounded-3xl" : ""} ${widthClassName || ""}`}
        style={{ width: widthClassName ? undefined : width, marginLeft: "auto", marginRight: "auto", backgroundColor: "#EEF1EF" }}
      />
    </div>
  );
}

export default function LocationMap(props) {
  const space = <MapSpace {...props} />;
  return (
    <WhenVisible placeholder={space}>
      <Suspense fallback={space}>
        <LocationMapView {...props} />
      </Suspense>
    </WhenVisible>
  );
}
