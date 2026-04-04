<<<<<<< HEAD
import { useRef, useState, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";

const SPEED = 25;
const BLOCK_THRESHOLD = 200;
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
=======
import { useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const SPEED = 35; // m/s
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8

function getDistance(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
<<<<<<< HEAD
  const x = dLng * Math.cos((toRad(a[1]) + toRad(b[1])) / 2);
=======
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x = dLng * Math.cos((lat1 + lat2) / 2);
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
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
<<<<<<< HEAD
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
=======
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}

export default function useRouting(mapRef, ambulanceStateRef) {
  const [status, setStatus] = useState("idle");
  const markersRef = useRef([]);
  const animRefs = useRef([]);
<<<<<<< HEAD
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
=======
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
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
    const distances = [0];
    for (let i = 1; i < coords.length; i++) {
      distances[i] = distances[i - 1] + getDistance(coords[i - 1], coords[i]);
    }
    return distances;
<<<<<<< HEAD
  };

  const animateAmbulance = (coords, distances, totalDistance, index, trailId) => {
=======
  }

  function animateAmbulance(coords, distances, totalDistance, index, trailId) {
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
    const map = mapRef.current;
    let startTime = null;

    function animate(now) {
<<<<<<< HEAD
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
=======
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
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8

      map.triggerRepaint();
      animRefs.current[index] = requestAnimationFrame(animate);
    }
<<<<<<< HEAD
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
=======

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
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
}