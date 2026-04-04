import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import useRouting from "./Userrouting";

function createCrossIcon(size = 32) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2, cy = size / 2;
  const armW = size * 0.22, armL = size * 0.42;

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "#d32f2f";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#d32f2f";
  ctx.fillRect(cx - armL, cy - armW / 2, armL * 2, armW);
  ctx.fillRect(cx - armW / 2, cy - armL, armW, armL * 2);

  return ctx.getImageData(0, 0, size, size);
}

/** Creates a fixed-size DOM element for a roadblock marker */
function createRoadblockElement() {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255, 0, 0, 0.35);
    border: 2.5px solid #aa0000;
    box-shadow: 0 0 0 4px rgba(255,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    cursor: pointer;
    pointer-events: none;
    transform: translate(-50%, -50%);
  `;
  el.innerHTML = "🚧";
  return el;
}

export default function Map3D() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const ambulanceStateRef = useRef([]);
  // roadblock markers stored as { lngLat, marker } objects
  const roadBlockMarkersRef = useRef([]);

  const { drawRoute, clearRoute, applyRoadBlocks, status } = useRouting(
    mapRef,
    ambulanceStateRef
  );

  const applyRoadBlocksRef = useRef(applyRoadBlocks);
  applyRoadBlocksRef.current = applyRoadBlocks;

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      wsRef.current = new WebSocket("ws://localhost:8080");
      wsRef.current.onopen = () => console.log("✅ Connected to Dispatch Server");
      wsRef.current.onmessage = (event) => {
        try {
          const routeData = JSON.parse(event.data);
          if (drawRoute && routeData.user_location && routeData.coordinates) {
            drawRoute([{ from: routeData.user_location, to: routeData.coordinates }]);
          }
        } catch (err) {
          console.error("Invalid route data:", err);
        }
      };
      wsRef.current.onclose = () => console.log("❌ WS disconnected");
      wsRef.current.onerror = (err) => console.error("⚠️ WS error:", err);
    }
  }, [drawRoute]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [73.8567, 18.5204],
      zoom: 16,
      pitch: 60,
      canvasContextAttributes: { antialias: true }
    });

    map.on("style.load", () => {
      loadAmbulance3DLayer(map);

      const layers = map.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (!labelLayerId && layer.type === "symbol" && layer.layout?.["text-field"]) {
          labelLayerId = layer.id;
        }
        if (
          layer.type === "symbol" &&
          (layer.id.includes("poi") || layer.id.includes("amenity") || layer.id.includes("shop"))
        ) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }

      const iconData = createCrossIcon(32);
      map.addImage("hospital-cross", iconData, { width: 32, height: 32, data: iconData.data });
      map.addSource("openfreemap", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
      map.addLayer(
        {
          id: "hospital-clinic-labels",
          type: "symbol",
          source: "openfreemap",
          "source-layer": "poi",
          minzoom: 12,
          filter: ["any", ["==", ["get", "class"], "hospital"], ["==", ["get", "class"], "clinic"]],
          layout: {
            "icon-image": "hospital-cross",
            "icon-size": 1,
            "text-field": ["get", "name"],
            "text-size": 12,
            "text-anchor": "top",
            "text-offset": [0, 1.2],
          },
          paint: {
            "text-color": "#d32f2f",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        },
        labelLayerId
      );
    });

    // ===== ROADBLOCK CLICK LISTENER — fixed-size DOM markers =====
    map.on("click", (e) => {
      const lngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

      // Create a fixed-size DOM marker (never scales with zoom)
      const el = createRoadblockElement();
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lngLat.lng, lngLat.lat])
        .addTo(map);

      roadBlockMarkersRef.current.push({ lngLat, marker });

      // Trigger reroute with all current blocks
      const blocks = roadBlockMarkersRef.current.map((b) => b.lngLat);
      if (applyRoadBlocksRef.current) {
        applyRoadBlocksRef.current(blocks);
      }
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  function loadAmbulance3DLayer(map) {
    if (map.getLayer("ambulance-3d")) return;
    const customLayer = {
      id: "ambulance-3d",
      type: "custom",
      renderingMode: "3d",

      onAdd(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        this.renderer.autoClear = false;

        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(0, -10, 10);
        this.scene.add(sun);

        this.models = [];
        this.baseModel = null;

        new GLTFLoader().load("/Ambulance.glb", (gltf) => {
          this.baseModel = gltf.scene;
          ambulanceStateRef.current.forEach((_, i) => {
            if (!this.models[i]) {
              const clone = this.baseModel.clone();
              clone.scale.set(3, 3, 3);
              clone.rotation.x = Math.PI / 2;
              this.scene.add(clone);
              this.models[i] = clone;
            }
          });
          map.triggerRepaint();
        });
      },

      render(gl, args) {
        if (!this.baseModel) return;
        const baseMatrix = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);

        ambulanceStateRef.current.forEach((amb, i) => {
          if (!this.models[i]) {
            const clone = this.baseModel.clone();
            clone.scale.set(3, 3, 3);
            clone.rotation.x = Math.PI / 2;
            this.scene.add(clone);
            this.models[i] = clone;
          }

          const model = this.models[i];
          const { lngLat, rotation, visible } = amb;
          model.visible = visible;

          const merc = maplibregl.MercatorCoordinate.fromLngLat(lngLat, 0);
          const rotationMatrix = new THREE.Matrix4().makeRotationZ(
            (-rotation * Math.PI) / 180 + Math.PI
          );
          const transform = new THREE.Matrix4()
            .makeTranslation(merc.x, merc.y, merc.z)
            .scale(
              new THREE.Vector3(
                merc.meterInMercatorCoordinateUnits(),
                -merc.meterInMercatorCoordinateUnits(),
                merc.meterInMercatorCoordinateUnits()
              )
            )
            .multiply(rotationMatrix);

          this.camera.projectionMatrix = baseMatrix.clone().multiply(transform);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
        });
      },
    };
    map.addLayer(customLayer);
  }

  function handleClear() {
    clearRoute();
    // Remove all roadblock DOM markers
    roadBlockMarkersRef.current.forEach(({ marker }) => marker.remove());
    roadBlockMarkersRef.current = [];
  }

  const routes = [
    { from: { lng: 73.8553, lat: 18.5174 }, to: { lng: 73.848825, lat: 18.533296 } },
    { from: { lng: 73.860, lat: 18.520 }, to: { lng: 73.859575, lat: 18.517022 } },
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(255,255,255,0.9)",
          padding: "10px 15px",
          borderRadius: "8px",
          fontWeight: "bold",
          zIndex: 50,
        }}
      >
        💡 Click anywhere on the map during transit to create a Road Block.
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          onClick={() => drawRoute(routes)}
          style={{
            padding: "14px 28px",
            borderRadius: "12px",
            border: "none",
            background: "#2196f3",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {status === "animating" ? "🚨 Dispatching..." : "🚑 Start Mission"}
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: "14px 28px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          Reset Map & Blocks
        </button>
      </div>
    </div>
  );
}