import { useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { mapPins, PIN_COLORS, MAP_CENTRE } from "../data/mobileMock";

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function makePin(type) {
  const fill = PIN_COLORS[type] ?? PIN_COLORS.default;
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4))">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${fill}"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  });
}

function makeUserPin() {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#1a6fdb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(26,111,219,0.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function LocateControl({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onLocate(p);
        map.flyTo([p.lat, p.lng], 16, { duration: 0.8 });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, [map, onLocate]);

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-5 right-4 w-11 h-11 rounded-full flex items-center justify-center z-[1000]"
      style={{ backgroundColor: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
      aria-label="Locate me"
    >
      {locating ? (
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }} />
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )}
    </button>
  );
}

export default function MapScreen() {
  const [userPos, setUserPos] = useState(null);
  const mapRef = useRef(null);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1.5" style={{ color: "#fff" }}>Map</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          Find places, attractions and useful information around town.
        </p>
      </div>

      <div className="relative flex-1 -mx-5 rounded-t-2xl overflow-hidden" style={{ minHeight: 320 }}>
        <MapContainer
          center={[MAP_CENTRE.lat, MAP_CENTRE.lng]}
          zoom={15}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
          ref={mapRef}
        >
          <TileLayer url={CARTO_VOYAGER} maxZoom={20} />
          {mapPins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makePin(pin.type)}>
              <Popup>
                <div style={{ textAlign: "center", minWidth: 120 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#1a3a42", margin: 0 }}>{pin.name}</p>
                  <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>{pin.category}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={makeUserPin()} />
          )}
          <LocateControl onLocate={setUserPos} />
        </MapContainer>
      </div>
    </div>
  );
}
