import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// The street map under every map on the site and in the app.
//
// OpenFreeMap (openfreemap.org): free, no API key, no sign-up, no usage cap,
// and allowed for production and commercial use. Its maps are vector tiles,
// drawn by MapLibre through its Leaflet bridge, so the markers, clusters and
// popups on top are ordinary Leaflet and didn't change.
//
// This replaced CARTO's Voyager tiles, which began stamping "API KEY
// REQUIRED" across every tile loaded without a key.
const STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function MapBase() {
  const map = useMap();
  // Marker clustering needs the map's zoom range, which the old raster tile
  // layer used to set. Set here before anything is clustered.
  if (map.getMaxZoom() === Infinity) map.setMaxZoom(20);
  useEffect(() => {
    const cleanups = [];
    const layer = L.maplibreGL({
      style: STYLE,
      attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    // Keep the street map filling its box: re-measure once laid out and
    // whenever the box changes size (the app's map resizes with the screen).
    const ml0 = layer.getMaplibreMap();
    const refit = () => { map.invalidateSize(); ml0.resize(); layer._update?.(); };
    const raf = requestAnimationFrame(refit);
    const ro = new ResizeObserver(refit);
    ro.observe(map.getContainer());
    cleanups.push(() => { cancelAnimationFrame(raf); ro.disconnect(); });
    return () => { cleanups.forEach((f) => f()); map.removeLayer(layer); };
  }, [map]);
  return null;
}
