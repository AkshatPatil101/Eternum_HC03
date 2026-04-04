import { useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const SPEED = 15; // m/s

export const HOSPITALS = [
  { name: "Sassoon Hospital", coords: { lng: 73.874, lat: 18.528 } },
  { name: "Ruby Hall Clinic", coords: { lng: 73.882, lat: 18.532 } },
  { name: "Deenanath Mangeshkar", coords: { lng: 73.829, lat: 18.497 } },
  { name: "KEM Hospital", coords: { lng: 73.865, lat: 18.521 } },
];

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

// ===== NEW: check if roadblock affects the route =====
function isBlockNearRoute(routeCoords, blocks, thresholdMeters = 250) {
  return routeCoords.some((pt) =>
    blocks.some((b) => getDistance([pt[0], pt[1]], [b.lng, b.lat]) < thresholdMeters)
  );
}

export default function useRouting(mapRef, ambulanceStateRef) {
  const [status, setStatus] = useState("idle");
  const markersRef = useRef([]);
  const animRefs = useRef([]);
  const trails = useRef([]);
  const activeMissions = useRef([]);
  const reroutingRef = useRef([]);

  function clearRoute() {
    const map = mapRef.current;
    if (!map) return;
    animRefs.current.forEach((id) => cancelAnimationFrame(id));
    animRefs.current = [];
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const style = map.getStyle();
    if (style?.layers) {
      style.layers.forEach((layer) => {
        if (layer.id.startsWith("route_") || layer.id.startsWith("trail_")) {
          map.removeLayer(layer.id);
          map.removeSource(layer.id);
        }
      });
    }
    trails.current = [];
    ambulanceStateRef.current = [];
    activeMissions.current = [];
    reroutingRef.current = [];
    setStatus("idle");
    map.triggerRepaint();
  }

  async function fetchRoute(from, to, blocks = []) {
    const apiKey = "41bd3551-0e91-46d7-8b7d-3c4d66d1c4ee";
    let url =
      `https://graphhopper.com/api/1/route` +
      `?point=${from.lat},${from.lng}` +
      `&point=${to.lat},${to.lng}` +
      `&profile=car&layer=json&key=${apiKey}&points_encoded=false`;

    if (blocks && blocks.length > 0) {
      url += `&ch.disable=true`;
      const blockStr = blocks.map((b) => `${b.lat},${b.lng},250`).join(";");
      url += `&block_area=${blockStr}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    if (!data.paths || data.paths.length === 0) throw new Error("No path found");
    return {
      coords: data.paths[0].points.coordinates,
      time: data.paths[0].time,
    };
  }

  function buildDistances(coords) {
    const distances = [0];
    for (let i = 1; i < coords.length; i++) {
      distances[i] = distances[i - 1] + getDistance(coords[i - 1], coords[i]);
    }
    return distances;
  }

  function animateAmbulance(coords, distances, totalDistance, index, trailId, distanceOffset = 0) {
    const map = mapRef.current;
    let startTime = null;

    function animate(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const distanceTravelled = distanceOffset + (elapsed / 1000) * SPEED;

      if (distanceTravelled >= totalDistance) {
        ambulanceStateRef.current[index].lngLat = coords[coords.length - 1];
        if (activeMissions.current[index]) {
          activeMissions.current[index].completed = true;
        }
        map.triggerRepaint();
        return;
      }

      let i = 1;
      while (i < distances.length && distances[i] < distanceTravelled) i++;
      if (i >= distances.length) i = distances.length - 1;

      const prevDist = distances[i - 1] ?? 0;
      const nextDist = distances[i];
      const t = nextDist === prevDist ? 1 : (distanceTravelled - prevDist) / (nextDist - prevDist);

      const a = coords[i - 1];
      const b = coords[i];
      if (!a || !b) {
        animRefs.current[index] = requestAnimationFrame(animate);
        return;
      }

      const pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const rot = bearing(a, b);

      ambulanceStateRef.current[index] = { lngLat: pos, rotation: rot, visible: true };

      trails.current[index].push(pos);
      map.getSource(trailId)?.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: trails.current[index] },
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
      const routesArray = await Promise.all(routeData.map((r) => fetchRoute(r.from, r.to, [])));

      routesArray.forEach((res, i) => {
        const coords = res.coords;
        const id = `route_${sessionId}_${i}`;
        const trailId = `trail_${sessionId}_${i}`;
        const ambIndex = ambulanceStateRef.current.length;

        const startMarker = new maplibregl.Marker({ color: "blue" })
          .setLngLat(coords[0])
          .addTo(map);
        const endMarker = new maplibregl.Marker({ color: "red" })
          .setLngLat(coords[coords.length - 1])
          .addTo(map);
        markersRef.current.push(startMarker, endMarker);

        map.addSource(id, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } },
        });
        map.addLayer({
          id,
          type: "line",
          source: id,
          paint: { "line-color": "#2196f3", "line-width": 6, "line-opacity": 0.8 },
        });

        trails.current.push([coords[0]]);
        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [coords[0]] } },
        });
        map.addLayer({
          id: trailId,
          type: "line",
          source: trailId,
          paint: { "line-color": "#9e9e9e", "line-width": 7 },
        });

        ambulanceStateRef.current.push({ lngLat: coords[0], rotation: 0, visible: true });
        reroutingRef.current.push(false);

        activeMissions.current.push({
          index: ambIndex,
          originalTo: routeData[i].to,
          routeId: id,
          trailId,
          destMarker: endMarker,
          completed: false,
        });

        const distances = buildDistances(coords);
        animateAmbulance(coords, distances, distances[distances.length - 1], ambIndex, trailId, 0);
      });

      setStatus("animating");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  // ===== UPDATED: selective rerouting only for affected ambulances =====
  async function applyRoadBlocks(blocks) {
    const map = mapRef.current;
    if (!map) return;

    for (let i = 0; i < ambulanceStateRef.current.length; i++) {
      const mission = activeMissions.current[i];
      if (!mission || mission.completed) continue;

      const routeSource = map.getSource(mission.routeId);
      const oldCoords = routeSource?._data?.geometry?.coordinates ?? [];

      // Skip ambulances whose route is not near any block
      if (!isBlockNearRoute(oldCoords, blocks)) continue;

      if (reroutingRef.current[i]) continue;
      reroutingRef.current[i] = true;

      const currentAmb = ambulanceStateRef.current[i];
      if (!currentAmb) {
        reroutingRef.current[i] = false;
        continue;
      }
      const livePos = { lng: currentAmb.lngLat[0], lat: currentAmb.lngLat[1] };

      if (animRefs.current[i]) {
        cancelAnimationFrame(animRefs.current[i]);
        animRefs.current[i] = null;
      }

      (async () => {
        try {
          const possibleDestinations = [
            { name: "Original Destination", coords: mission.originalTo },
            ...HOSPITALS,
          ];

          const routePromises = possibleDestinations.map(async (dest) => {
            try {
              const res = await fetchRoute(livePos, dest.coords, blocks);
              return { ...res, destination: dest };
            } catch {
              return null;
            }
          });

          const results = (await Promise.all(routePromises)).filter(Boolean);

          if (results.length === 0) {
            const oldSrc = map.getSource(mission.routeId);
            if (oldSrc) {
              const oldCoords = oldSrc._data?.geometry?.coordinates ?? [];
              if (oldCoords.length > 1) {
                const distances = buildDistances(oldCoords);
                animateAmbulance(oldCoords, distances, distances[distances.length - 1], i, mission.trailId, 0);
              }
            }
            reroutingRef.current[i] = false;
            return;
          }

          results.sort((a, b) => a.time - b.time);
          const best = results[0];
          const newCoords = best.coords;

          console.log(`🚑 Ambulance ${i} rerouting → ${best.destination.name} (${(best.time / 60000).toFixed(1)} min ETA)`);

          if (mission.destMarker) {
            mission.destMarker.setLngLat([best.destination.coords.lng, best.destination.coords.lat]);
          }

          map.getSource(mission.routeId)?.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: newCoords },
          });

          trails.current[i] = [newCoords[0]];
          map.getSource(mission.trailId)?.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: [newCoords[0]] },
          });

          const distances = buildDistances(newCoords);
          animateAmbulance(newCoords, distances, distances[distances.length - 1], i, mission.trailId, 0);
        } catch (err) {
          console.error(`Reroute failed for ambulance ${i}:`, err);
          reroutingRef.current[i] = false;
        } finally {
          reroutingRef.current[i] = false;
        }
      })();
    }
  }

  return { drawRoute, clearRoute, applyRoadBlocks, status };
}