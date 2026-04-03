import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouting } from "./Userrouting";


export default function MapUI3D() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const ambulanceStateRef = useRef({
    lngLat: [73.8446, 18.5308],
    rotation: 0,
    visible: false
  });

  const { drawRoute, clearRoute, status } = useRouting(mapRef, ambulanceStateRef);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [73.8567, 18.5204],
      zoom: 16,
      pitch: 60,
      canvasContextAttributes: { antialias: true },
    });

    map.on("style.load", () => {
      loadAmbulance3DLayer(map);
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
          antialias: true
        });
        this.renderer.autoClear = false;

        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(0, -10, 10);
        this.scene.add(sun);

        new GLTFLoader().load("/Ambulance.glb", (gltf) => {
          this.model = gltf.scene;
          // IMPORTANT: Scale needs to be large enough to see
          // In your working model it was 1, here we multiply by a factor
          this.model.scale.set(3, 3, 3);
          this.model.rotation.x = Math.PI / 2;
          this.scene.add(this.model);
          map.triggerRepaint();
        });
      },

      // Use 'args' to get the matrix exactly like your working model
      render(gl, args) {
        if (!this.model) return;

        const { lngLat, rotation, visible } = ambulanceStateRef.current;
        this.model.visible = visible;

        const merc = maplibregl.MercatorCoordinate.fromLngLat(lngLat, 0);

        const m = new THREE.Matrix4().fromArray(
          args.defaultProjectionData.mainMatrix
        );

        // --- THE FIX: Add Math.PI (180 degrees) to the rotation ---
        const rotationMatrix = new THREE.Matrix4().makeRotationZ(
          (-rotation * (Math.PI / 180)) + Math.PI
        );

        const l = new THREE.Matrix4()
          .makeTranslation(merc.x, merc.y, merc.z)
          .scale(new THREE.Vector3(
            merc.meterInMercatorCoordinateUnits(),
            -merc.meterInMercatorCoordinateUnits(),
            merc.meterInMercatorCoordinateUnits()
          ))
          .multiply(rotationMatrix);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      }
    };

    map.addLayer(customLayer);
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: "12px" }}>
        <button
          onClick={drawRoute}
          style={{ padding: "14px 28px", borderRadius: "12px", border: "none", background: "#2196f3", color: "white", fontWeight: "bold", cursor: "pointer" }}
        >
          {status === "animating" ? "🚨 Dispatching..." : "🚑 Start Mission"}
        </button>
        <button onClick={clearRoute} style={{ padding: "14px 28px", borderRadius: "12px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}