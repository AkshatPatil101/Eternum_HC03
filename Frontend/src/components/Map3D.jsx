import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouting } from "./Userrouting";

function createCrossIcon(size = 32) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2, cy = size / 2;
  const armW = size * 0.22, armL = size * 0.42;
  ctx.beginPath(); ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "#d32f2f"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#d32f2f";
  ctx.fillRect(cx - armL, cy - armW / 2, armL * 2, armW);
  ctx.fillRect(cx - armW / 2, cy - armL, armW, armL * 2);
  return ctx.getImageData(0, 0, size, size);
}

export default function MapUI() {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const { drawRoute, clearRoute, status, info } = useRouting(mapRef);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [73.8567, 18.5204],
      zoom: 16,
      pitch: 60,
      bearing: -20,
      canvasContextAttributes: { antialias: true }
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }),
      "top-right"
    );

    map.on("load", () => {
      const layers = map.getStyle().layers;
      let labelLayerId;

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (!labelLayerId && layer.type === "symbol" && layer.layout?.["text-field"]) {
          labelLayerId = layer.id;
        }
        if (
          layer.type === "symbol" &&
          (
            layer.id.includes("poi")     || layer.id.includes("icon") ||
            layer.id.includes("amenity") || layer.id.includes("shop") ||
            layer.id.includes("tourism") || layer.id.includes("office") ||
            layer.id.includes("facility")
          )
        ) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }

      const iconData = createCrossIcon(32);
      map.addImage("hospital-cross", iconData, { width: 32, height: 32, data: iconData.data });

      map.addSource("openfreemap", { type: "vector", url: "https://tiles.openfreemap.org/planet" });

      map.addLayer({
        id: "3d-buildings",
        source: "openfreemap", "source-layer": "building",
        type: "fill-extrusion", minzoom: 15,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": ["interpolate", ["linear"], ["get", "render_height"], 0, "lightgray", 200, "royalblue", 400, "lightblue"],
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"]],
          "fill-extrusion-base": ["case", [">=", ["zoom"], 16], ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.9
        }
      }, labelLayerId);

      map.addLayer({
        id: "hospital-clinic-labels",
        type: "symbol", source: "openfreemap", "source-layer": "poi", minzoom: 12,
        filter: ["any", ["==", ["get", "class"], "hospital"], ["==", ["get", "class"], "clinic"]],
        layout: {
          "icon-image": "hospital-cross", "icon-size": 1, "icon-allow-overlap": true,
          "text-field": ["get", "name"], "text-size": 12, "text-anchor": "top",
          "text-offset": [0, 1.2], "text-max-width": 10, "text-allow-overlap": false
        },
        paint: { "text-color": "#d32f2f", "text-halo-color": "#ffffff", "text-halo-width": 2 }
      });
    });

    map.on("webglcontextlost", (e) => { e.preventDefault(); });
    mapRef.current = map;
    return () => { map.remove(); };
  }, []);

  const isActive = status === "loading" || status === "animating";

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 1,
        background: "white", padding: "8px 12px",
        borderRadius: "12px", fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        Pune 3D Ambulance Map
      </div>

      <div style={{
        position: "absolute", bottom: 24, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 10, zIndex: 1
      }}>

        <button
          onClick={isActive ? undefined : drawRoute}
          disabled={isActive}
          style={{
            padding: "11px 22px",
            background: isActive ? "#90caf9" : "#2196f3",
            color: "white", border: "none",
            borderRadius: "12px", fontWeight: 700,
            fontSize: 14, cursor: isActive ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(33,150,243,0.45)",
            display: "flex", alignItems: "center", gap: 8,
            transition: "background 0.2s"
          }}
        >
          {status === "loading"   && "⏳ Fetching route…"}
          {status === "animating" && "🚑 En route…"}
          {status === "done"      && "🔁 Replay"}
          {status === "idle"      && "🚑 Dispatch Ambulance"}
          {status === "error"     && "⚠️ Retry"}
        </button>

        {(status === "animating" || status === "done") && (
          <button
            onClick={clearRoute}
            style={{
              padding: "11px 16px",
              background: "white", color: "#555",
              border: "1px solid #ddd", borderRadius: "12px",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            ✕ Clear
          </button>
        )}

        {info && (
          <div style={{
            padding: "11px 14px",
            background: "white", borderRadius: "12px",
            fontSize: 13, fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            color: "#333"
          }}>
            📍 {info.distKm} km · ~{info.durMin} min
          </div>
        )}

        {status === "error" && (
          <div style={{
            padding: "11px 14px", background: "#ffebee",
            color: "#c62828", borderRadius: "12px", fontSize: 13
          }}>
            Route unavailable
          </div>
        )}
      </div>
    </div>
  );
}