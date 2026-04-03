import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapUI() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return; 

    const map = new maplibregl.Map({
      container: mapContainer.current,

      
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm-tiles"
          }
        ]
      },

      center: [73.8567, 18.5204],
      zoom: 16
    });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }),
      "top-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative"
      }}
    >
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          inset: 0
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "white",
          padding: "8px 12px",
          borderRadius: "12px",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >
        Pune Ambulance Map
      </div>
    </div>
  );
}
