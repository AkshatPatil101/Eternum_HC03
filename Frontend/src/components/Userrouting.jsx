import { useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const FROM = { lng: 73.8446, lat: 18.5308, label: "Shivajinagar" };
const TO   = { lng: 73.8553, lat: 18.5174, label: "KEM Hospital" };



const SPEED_KMPH = 58;   
const TARGET_FPS = 60;
const MAX_POINTS = 80;

const FRAME_INTERVAL = 1000 / TARGET_FPS;



function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;

  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);

  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildDistanceTable(coords) {
  const distances = [0];

  for (let i = 1; i < coords.length; i++) {
    distances[i] =
      distances[i - 1] +
      haversine(coords[i - 1], coords[i]);
  }

  return distances;
}

function interpolateByDistance(coords, distances, targetDistance) {
  let i = 0;

  while (
    i < distances.length &&
    distances[i] < targetDistance
  ) {
    i++;
  }

  if (i === 0) return coords[0];

  if (i >= coords.length)
    return coords[coords.length - 1];

  const prevDist = distances[i - 1];
  const nextDist = distances[i];

  const t =
    (targetDistance - prevDist) /
    (nextDist - prevDist);

  const a = coords[i - 1];
  const b = coords[i];

  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];
}

function bearing(a, b) {
  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;

  const dLng = toRad(b[0] - a[0]);

  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const x =
    Math.sin(dLng) *
    Math.cos(lat2);

  const y =
    Math.cos(lat1) *
      Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(dLng);

  return (
    toDeg(Math.atan2(x, y)) +
    360
  ) % 360;
}

function downsample(coords, max) {
  if (coords.length <= max)
    return coords;

  const step =
    (coords.length - 1) /
    (max - 1);

  const result = [];

  for (let i = 0; i < max; i++) {
    result.push(
      coords[Math.round(i * step)]
    );
  }

  return result;
}



function createAmbulanceIcon(size = 48) {
  const canvas =
    document.createElement("canvas");

  canvas.width = size;
  canvas.height = size;

  const ctx =
    canvas.getContext("2d");

  const s = size / 48;

  ctx.fillStyle = "#fff";

  ctx.beginPath();
  ctx.roundRect(
    6 * s,
    14 * s,
    36 * s,
    24 * s,
    4 * s
  );

  ctx.fill();

  ctx.strokeStyle = "#d32f2f";

  ctx.lineWidth = 2 * s;

  ctx.stroke();

  return canvas;
}



export function useRouting(mapRef) {
  const [status, setStatus] =
    useState("idle");

  const [info, setInfo] =
    useState(null);

  const markersRef =
    useRef([]);

  const ambulanceMarkerRef =
    useRef(null);

  const animFrameRef =
    useRef(null);

  const sirenIntervalRef =
    useRef(null);

  const lastFrameTimeRef =
    useRef(0);

  const travelledCoordsRef =
    useRef([]);

  function clearRoute() {
    const map = mapRef.current;

    if (!map) return;

    cancelAnimationFrame(
      animFrameRef.current
    );

    clearInterval(
      sirenIntervalRef.current
    );

    ambulanceMarkerRef.current?.remove();

    markersRef.current.forEach(
      (m) => m.remove()
    );

    markersRef.current = [];

    ["route-travelled",
     "route-casing",
     "route-line"
    ].forEach((id) => {
      if (map.getLayer(id))
        map.removeLayer(id);
    });

    ["route-travelled",
     "route"
    ].forEach((id) => {
      if (map.getSource(id))
        map.removeSource(id);
    });

    travelledCoordsRef.current =
      [];

    setStatus("idle");
    setInfo(null);
  }

  function startAnimation(
    coords,
    distances,
    totalDistance
  ) {
    const map = mapRef.current;

    const el =
      createAmbulanceIcon(48);

    ambulanceMarkerRef.current =
      new maplibregl.Marker({
        element: el,
        rotationAlignment: "map",
        anchor: "center"
      })
        .setLngLat(coords[0])
        .addTo(map);

    const speedMps =
      SPEED_KMPH * 1000 / 3600;

    let startTime = null;

    function animate(now) {
      if (
        now -
          lastFrameTimeRef.current <
        FRAME_INTERVAL
      ) {
        animFrameRef.current =
          requestAnimationFrame(
            animate
          );
        return;
      }

      lastFrameTimeRef.current =
        now;

      if (!startTime)
        startTime = now;

      const elapsed =
        (now - startTime) / 1000;

      const travelledDistance =
        elapsed * speedMps;

      const progress =
        Math.min(
          travelledDistance /
            totalDistance,
          1
        );

      const pos =
        interpolateByDistance(
          coords,
          distances,
          travelledDistance
        );

      const nextPos =
        interpolateByDistance(
          coords,
          distances,
          travelledDistance + 2
        );

      const rot =
        bearing(pos, nextPos);

      ambulanceMarkerRef.current?.setLngLat(
        pos
      );

      ambulanceMarkerRef.current?.setRotation(
        rot
      );

      if (
        travelledCoordsRef.current
          .length === 0 ||
        progress -
          travelledCoordsRef.current
            .lastProgress >
          0.01
      ) {
        travelledCoordsRef.current.push(
          pos
        );

        travelledCoordsRef.current.lastProgress =
          progress;

        map
          .getSource(
            "route-travelled"
          )
          ?.setData({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates:
                travelledCoordsRef.current
            }
          });
      }

      if (progress < 1) {
        animFrameRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        setStatus("done");
      }
    }

    animFrameRef.current =
      requestAnimationFrame(
        animate
      );
  }

  async function drawRoute() {
    const map = mapRef.current;

    if (!map) return;

    clearRoute();

    setStatus("loading");

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
          `${FROM.lng},${FROM.lat};` +
          `${TO.lng},${TO.lat}` +
          `?overview=full&geometries=geojson`
      );

      const data =
        await res.json();

      if (
        data.code !== "Ok" ||
        !data.routes.length
      )
        throw new Error("No route");

      const route =
        data.routes[0];

      const coords =
        downsample(
          route.geometry
            .coordinates,
          MAX_POINTS
        );

      const distances =
        buildDistanceTable(coords);

      const totalDistance =
        distances[
          distances.length - 1
        ];

      markersRef.current = [
        new maplibregl.Marker({
          color: "#1976d2"
        })
          .setLngLat([
            FROM.lng,
            FROM.lat
          ])
          .addTo(map),

        new maplibregl.Marker({
          color: "#d32f2f"
        })
          .setLngLat([
            TO.lng,
            TO.lat
          ])
          .addTo(map)
      ];

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry:
            route.geometry
        }
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color":
            "#b0bec5",
          "line-width": 4
        }
      });

      map.addSource(
        "route-travelled",
        {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                coords[0]
              ]
            }
          }
        }
      );

      map.addLayer({
        id: "route-travelled",
        type: "line",
        source:
          "route-travelled",
        paint: {
          "line-color":
            "#2196f3",
          "line-width": 5
        }
      });

      setInfo({
        distKm: (
          route.distance /
          1000
        ).toFixed(1),

        durMin: Math.round(
          totalDistance /
            (SPEED_KMPH * 1000) *
            60
        )
      });

      setStatus("animating");

      setTimeout(
        () =>
          startAnimation(
            coords,
            distances,
            totalDistance
          ),
        800
      );

    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return {
    drawRoute,
    clearRoute,
    status,
    info
  };
}