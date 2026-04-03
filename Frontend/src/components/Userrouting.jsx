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
  const trails = useRef([[], []]);

  function clearRoute() {
    const map = mapRef.current;
    if (!map) return;

    animRefs.current.forEach((id) => cancelAnimationFrame(id));
    animRefs.current = [];

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    ["route1", "route2", "trail1", "trail2"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    trails.current = [[], []];
    ambulanceStateRef.current = ambulanceStateRef.current.map(() => ({
      visible: false
    }));

    setStatus("idle");
    map.triggerRepaint();
  }

  async function fetchRoute(from, to) {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    return data.routes[0].geometry.coordinates;
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
        ambulanceStateRef.current[index] = {
          lngLat: coords[coords.length - 1],
          rotation: 0,
          visible: true
        };
        map.triggerRepaint();
        return;
      }

      let i = 1;
      while (distances[i] < distanceTravelled) i++;
      const prevDist = distances[i - 1];
      const nextDist = distances[i];
      const t = (distanceTravelled - prevDist) / (nextDist - prevDist);

      const a = coords[i - 1];
      const b = coords[i];

      const pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const rot = bearing(a, b);

      ambulanceStateRef.current[index] = {
        lngLat: pos,
        rotation: rot,
        visible: true
      };

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
    // routeData = [{ from, to }, { from, to }]
    const map = mapRef.current;
    if (!map) return;

    clearRoute();
    setStatus("loading");

    try {
      const coordsArray = await Promise.all(
        routeData.map((r) => fetchRoute(r.from, r.to))
      );

      const distancesArray = coordsArray.map((c) => buildDistances(c));
      const totals = distancesArray.map((d) => d[d.length - 1]);

      // markers
      markersRef.current = routeData.flatMap((r) => [
        new maplibregl.Marker({ color: "blue" }).setLngLat([r.from.lng, r.from.lat]).addTo(map),
        new maplibregl.Marker({ color: "red" }).setLngLat([r.to.lng, r.to.lat]).addTo(map)
      ]);

      // routes
      coordsArray.forEach((coords, i) => {
        const id = `route${i + 1}`;
        const color = i === 0 ? "#2196f3" : "#4caf50";

        map.addSource(id, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } }
        });

        map.addLayer({ id, type: "line", source: id, paint: { "line-color": color, "line-width": 8 } });

        // trails
        const trailId = `trail${i + 1}`;
        trails.current[i] = [coords[0]];
        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [coords[0]] } }
        });
        map.addLayer({ id: trailId, type: "line", source: trailId, paint: { "line-color": "#ccc", "line-width": 6 } });
      });

      ambulanceStateRef.current = coordsArray.map((c) => ({
        lngLat: c[0],
        rotation: 0,
        visible: true
      }));

      setStatus("animating");

      coordsArray.forEach((coords, i) => {
        animateAmbulance(coords, distancesArray[i], totals[i], i, `trail${i + 1}`);
      });
    } catch (err) {
      setStatus("error");
    }
  }

  return { drawRoute, clearRoute, status };
}