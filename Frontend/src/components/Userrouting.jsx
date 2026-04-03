 import { useRef, useState } from "react";

import maplibregl from "maplibre-gl";


const SPEED = 35; // m/s


function getDistance(a, b) {

const R = 6371000;

const toRad = (d) => (d * Math.PI) / 180;

const dLat = toRad(b[1] - a[1]);

const dLng = toRad(b[0] - a[0]);

const lat1 = toRad(a[1]);

const lat2 = toRad(b[1]);

const x = dLng * Math.cos((lat1 + lat2) / 2);

const y = dLat;

return Math.sqrt(x * x + y * y) * R;

}


function bearing(a, b) {

const toRad = (d) => (d * Math.PI) / 180;

const toDeg = (r) => (r * 180) / Math.PI;

const dLng = toRad(b[0] - a[0]);

const lat1 = toRad(a[1]);

const lat2 = toRad(b[1]);

const x = Math.sin(dLng) * Math.cos(lat2);

const y =

Math.cos(lat1) * Math.sin(lat2) -

Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

return (toDeg(Math.atan2(x, y)) + 360) % 360;

}

export default function useRouting(mapRef, ambulanceStateRef) {
  const [status, setStatus] = useState("idle");
  const markersRef = useRef([]);
  const animRefs = useRef([]);
  const trails = useRef([]);

  function clearRoute() {
    const map = mapRef.current;
    if (!map) return;
    animRefs.current.forEach((id) => cancelAnimationFrame(id));
    animRefs.current = [];
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.id.startsWith("route_") || layer.id.startsWith("trail_")) {
          map.removeLayer(layer.id);
          map.removeSource(layer.id);
        }
      });
    }
    trails.current = [];
    ambulanceStateRef.current = [];
    setStatus("idle");
    map.triggerRepaint();
  }

  async function fetchRoute(from, to) {
    const apiKey = "41bd3551-0e91-46d7-8b7d-3c4d66d1c4ee";
    const url = `https://graphhopper.com/api/1/route?point=${from.lat},${from.lng}&point=${to.lat},${to.lng}&profile=car&layer=json&key=${apiKey}&points_encoded=false`;
    const res = await fetch(url);
    const data = await res.json();
    return data.paths[0].points.coordinates;
  }

  function buildDistances(coords) {
    const distances = [0];
    for (let i = 1; i < coords.length; i++) {
      distances[i] = distances[i - 1] + getDistance(coords[i - 1], coords[i]);
    }
    return distances;
  }

  function animateAmbulance(coords, distances, totalDistance, index, trailId) {
    const map = mapRef.current;
    let startTime = null;

    function animate(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const distanceTravelled = (elapsed / 1000) * SPEED;

      if (distanceTravelled >= totalDistance) {
        ambulanceStateRef.current[index].lngLat = coords[coords.length - 1];
        map.triggerRepaint();
        return;
      }

      let i = 1;
      while (i < distances.length && distances[i] < distanceTravelled) i++;
      const prevDist = distances[i - 1];
      const nextDist = distances[i];
      const t = (distanceTravelled - prevDist) / (nextDist - prevDist);

      const a = coords[i - 1];
      const b = coords[i];
      const pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const rot = bearing(a, b);

      ambulanceStateRef.current[index] = { lngLat: pos, rotation: rot, visible: true };

      // Update the Grey Trail (History)
      trails.current[index].push(pos);
      map.getSource(trailId)?.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: trails.current[index] }
      });

      map.triggerRepaint();
      animRefs.current[index] = requestAnimationFrame(animate);
    }
    animRefs.current[index] = requestAnimationFrame(animate);
  }

  async function drawRoute(routeData) {
    const map = mapRef.current;
    if (!map) return;
    setStatus("loading");

    try {
      const sessionId = Date.now();
      const coordsArray = await Promise.all(routeData.map((r) => fetchRoute(r.from, r.to)));

      coordsArray.forEach((coords, i) => {
        const id = `route_${sessionId}_${i}`;
        const trailId = `trail_${sessionId}_${i}`;
        const ambIndex = ambulanceStateRef.current.length;

        // Add Markers
        markersRef.current.push(new maplibregl.Marker({ color: "blue" }).setLngLat(coords[0]).addTo(map));
        markersRef.current.push(new maplibregl.Marker({ color: "red" }).setLngLat(coords[coords.length - 1]).addTo(map));

        // 1. THE "FRONT" PATH (Blue - Journey to be covered)
        map.addSource(id, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } }
        });
        map.addLayer({
          id,
          type: "line",
          source: id,
          paint: { "line-color": "#2196f3", "line-width": 6, "line-opacity": 0.8 }
        });

        // 2. THE "BEHIND" PATH (Grey - History)
        trails.current.push([coords[0]]);
        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [coords[0]] } }
        });
        map.addLayer({
          id: trailId,
          type: "line",
          source: trailId,
          paint: { "line-color": "#9e9e9e", "line-width": 7 } // Grey draws over blue
        });

        // 3. AMBULANCE STATE
        ambulanceStateRef.current.push({ lngLat: coords[0], rotation: 0, visible: true });

        const distances = buildDistances(coords);
        animateAmbulance(coords, distances, distances[distances.length - 1], ambIndex, trailId);
      });

      setStatus("animating");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return { drawRoute, clearRoute, status };
}