import { useRef, useState, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";

const SPEED = 25;
const BLOCK_THRESHOLD = 200;
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

function getDistance(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const x = dLng * Math.cos((toRad(a[1]) + toRad(b[1])) / 2);
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
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}

export default function useRouting(mapRef, ambulanceStateRef) {
  const [status, setStatus] = useState("idle");
  const markersRef = useRef([]);
  const animRefs = useRef([]);
  const trails = useRef([]);
  const activeMissions = useRef([]);
  const reroutingRef = useRef([]);
  const roadBlocksRef = useRef([]);


  const fetchRoute = async (from, to, blocks = []) => {
    let waypoints = [from, to];


    if (blocks.length > 0) {
      const block = blocks[0];
      const dx = to.lng - from.lng;
      const dy = to.lat - from.lat;
      const len = Math.hypot(dx, dy);

      const perp = {
        lng: block.lng + (-dy / len) * 0.003,
        lat: block.lat + (dx / len) * 0.003,
      };
      waypoints = [from, perp, to];
    }

    const coordsStr = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `${OSRM_BASE}/${coordsStr}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok") throw new Error("OSRM Routing Error");

    return {
      coords: data.routes[0].geometry.coordinates,
      time: data.routes[0].duration,
    };
  };

  const buildDistances = (coords) => {
    const distances = [0];
    for (let i = 1; i < coords.length; i++) {
      distances[i] = distances[i - 1] + getDistance(coords[i - 1], coords[i]);
    }
    return distances;
  };

  const animateAmbulance = (coords, distances, totalDistance, index, trailId) => {
    const map = mapRef.current;
    let startTime = null;

    function animate(now) {
      const amb = ambulanceStateRef.current[index];
      if (!amb || amb.paused) return;

      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const travelled = (elapsed / 1000) * SPEED;

      if (travelled >= totalDistance) {
        activeMissions.current[index].completed = true;
        return;
      }

      let iCoord = 1;
      while (iCoord < distances.length && distances[iCoord] < travelled) {
        iCoord++;
      }

      const prev = coords[iCoord - 1];
      const next = coords[iCoord];
      const t = (travelled - distances[iCoord - 1]) / (distances[iCoord] - distances[iCoord - 1]);

      const pos = [
        prev[0] + (next[0] - prev[0]) * t,
        prev[1] + (next[1] - prev[1]) * t,
      ];

      const rot = bearing(prev, next);
      ambulanceStateRef.current[index] = { ...amb, lngLat: pos, rotation: rot, visible: true };

      trails.current[index].push(pos);
      const source = map.getSource(trailId);
      if (source) {
        source.setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: trails.current[index] },
        });
      }

      map.triggerRepaint();
      animRefs.current[index] = requestAnimationFrame(animate);
    }
    animRefs.current[index] = requestAnimationFrame(animate);
  };

  const applyRoadBlocks = useCallback(async (blocks, ambIndex = null) => {
    roadBlocksRef.current = blocks;
    const map = mapRef.current;
    if (!map) return;

    const indexes = ambIndex !== null ? [ambIndex] : ambulanceStateRef.current.map((_, i) => i);

    for (let i of indexes) {
      const mission = activeMissions.current[i];
      if (!mission || mission.completed || reroutingRef.current[i]) continue;

      reroutingRef.current[i] = true;
      if (animRefs.current[i]) cancelAnimationFrame(animRefs.current[i]);
      ambulanceStateRef.current[i].paused = true;

      try {
        const currentPos = {
          lng: ambulanceStateRef.current[i].lngLat[0],
          lat: ambulanceStateRef.current[i].lngLat[1],
        };

        const result = await fetchRoute(currentPos, mission.originalTo, blocks);

        map.getSource(mission.routeId)?.setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: result.coords },
        });

        trails.current[i] = [result.coords[0]];
        const dists = buildDistances(result.coords);
        ambulanceStateRef.current[i].paused = false;

        animateAmbulance(result.coords, dists, dists[dists.length - 1], i, mission.trailId);
      } catch (err) {
        console.error("OSRM Reroute Fail:", err);
      }
      reroutingRef.current[i] = false;
    }
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      if (!roadBlocksRef.current.length) return;
      ambulanceStateRef.current.forEach((amb, i) => {
        if (!amb || reroutingRef.current[i] || activeMissions.current[i]?.completed) return;

        roadBlocksRef.current.forEach((block) => {
          const dist = getDistance(amb.lngLat, [block.lng, block.lat]);
          if (dist < BLOCK_THRESHOLD) {
            applyRoadBlocks(roadBlocksRef.current, i);
          }
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [applyRoadBlocks]);

  const drawRoute = async (routeData) => {
    const map = mapRef.current;
    if (!map) return;
    setStatus("loading");

    try {
      const sessionId = Date.now();
      for (let i = 0; i < routeData.length; i++) {
        const res = await fetchRoute(routeData[i].from, routeData[i].to);
        const coords = res.coords;
        const routeId = `route_${sessionId}_${i}`;
        const trailId = `trail_${sessionId}_${i}`;
        const ambIndex = ambulanceStateRef.current.length;

        map.addSource(routeId, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } },
        });
        map.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          paint: { "line-color": "#2196f3", "line-width": 6, "line-opacity": 0.5 },
        });

        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [coords[0]] } },
        });
        map.addLayer({
          id: trailId,
          type: "line",
          source: trailId,
          paint: { "line-color": "#f44336", "line-width": 8 },
        });

        ambulanceStateRef.current.push({ lngLat: coords[0], rotation: 0, visible: true, paused: false });
        activeMissions.current.push({ index: ambIndex, originalTo: routeData[i].to, routeId, trailId, completed: false });
        reroutingRef.current.push(false);
        trails.current.push([coords[0]]);

        const dists = buildDistances(coords);
        animateAmbulance(coords, dists, dists[dists.length - 1], ambIndex, trailId);
      }
      setStatus("animating");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const clearRoute = () => {
    const map = mapRef.current;
    animRefs.current.forEach(cancelAnimationFrame);
    const style = map?.getStyle();
    if (style?.layers) {
      style.layers.forEach((l) => {
        if (l.id.startsWith("route_") || l.id.startsWith("trail_")) {
          map.removeLayer(l.id);
          map.removeSource(l.id);
        }
      });
    }
    ambulanceStateRef.current = [];
    activeMissions.current = [];
    trails.current = [];
    roadBlocksRef.current = [];
    setStatus("idle");
  };

  return { drawRoute, clearRoute, applyRoadBlocks, status };
}