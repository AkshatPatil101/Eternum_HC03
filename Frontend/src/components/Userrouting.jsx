import { useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const FROM = { lng: 73.8446, lat: 18.5308 };
const TO = { lng: 73.8553, lat: 18.5174 };

const DURATION = 40000; // 20 seconds to finish the route

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function interpolateAlongRoute(coords, progress) {
  const total = coords.length - 1;
  const exact = progress * total;
  const idx = Math.min(Math.floor(exact), total - 1);
  const t = exact - idx;
  const a = coords[idx];
  const b = coords[idx + 1] || coords[total];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}

export function useRouting(mapRef, ambulanceStateRef) {
  const [status, setStatus] = useState("idle");
  const [info, setInfo] = useState(null);
  const markersRef = useRef([]);
  const animFrameRef = useRef(null);
  const travelledCoordsRef = useRef([]);

  function clearRoute() {
    const map = mapRef.current;
    if (!map) return;
    cancelAnimationFrame(animFrameRef.current);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getLayer("route-travelled")) map.removeLayer("route-travelled");
    if (map.getSource("route")) map.removeSource("route");
    if (map.getSource("route-travelled")) map.removeSource("route-travelled");

    travelledCoordsRef.current = [];
    ambulanceStateRef.current.visible = false;
    setStatus("idle");
    setInfo(null);
    map.triggerRepaint();
  }

  function startAnimation(coords) {
    const map = mapRef.current;
    let startTime = null;

    function animate(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = easeInOut(progress);

      const pos = interpolateAlongRoute(coords, eased);
      const nextPos = interpolateAlongRoute(coords, Math.min(eased + 0.001, 1));
      const rot = bearing(pos, nextPos);

      // Push updates to the 3D Layer Ref
      ambulanceStateRef.current.lngLat = pos;
      ambulanceStateRef.current.rotation = rot;
      ambulanceStateRef.current.visible = true;

      // Update the "trail" on the map
      travelledCoordsRef.current.push(pos);
      map.getSource("route-travelled")?.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: travelledCoordsRef.current }
      });

      // Force the 3D custom layer to render the new position
      map.triggerRepaint();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setStatus("done");
      }
    }
    animFrameRef.current = requestAnimationFrame(animate);
  }

  async function drawRoute() {
    const map = mapRef.current;
    if (!map) return;
    clearRoute();
    setStatus("loading");

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${FROM.lng},${FROM.lat};${TO.lng},${TO.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      const route = data.routes[0];
      const coords = route.geometry.coordinates;

      markersRef.current = [
        new maplibregl.Marker({ color: "#1976d2" }).setLngLat([FROM.lng, FROM.lat]).addTo(map),
        new maplibregl.Marker({ color: "#d32f2f" }).setLngLat([TO.lng, TO.lat]).addTo(map)
      ];

      map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: route.geometry } });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#ccc", "line-width": 4 } });

      map.addSource("route-travelled", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [coords[0]] } } });
      map.addLayer({ id: "route-travelled", type: "line", source: "route-travelled", paint: { "line-color": "#2196f3", "line-width": 5 } });

      setInfo({ distKm: (route.distance / 1000).toFixed(1), durMin: Math.round(route.duration / 60) });
      setStatus("animating");
      startAnimation(coords);
    } catch (err) {
      setStatus("error");
    }
  }

  return { drawRoute, clearRoute, status, info };
}