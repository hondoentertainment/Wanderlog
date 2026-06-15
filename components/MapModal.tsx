/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment -- Leaflet and leaflet.heat are global scripts */
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { TravelLocation } from '../types';

interface MapModalProps {
  name: string;
  coords: { lat: number; lng: number; zoom?: number };
  onClose: () => void;
  onSaveView?: (coords: { lat: number; lng: number; zoom: number }) => void;
  allLocations?: TravelLocation[]; // For heatmap
}

export const MapModal: React.FC<MapModalProps> = ({ name, coords, onClose, onSaveView, allLocations = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(coords.zoom || 6);
  const [currentView, setCurrentView] = useState({ lat: coords.lat, lng: coords.lng });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const heatLayer = useRef<any>(null);
  const markers = useRef<any[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      const initialZoom = coords.zoom || 6;
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([coords.lat, coords.lng], initialZoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      // Primary marker
      const primaryMarker = L.marker([coords.lat, coords.lng])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();

      markers.current.push(primaryMarker);

      // Listen for moves/zooms to update UI display
      mapInstance.current.on('move', () => {
        const center = mapInstance.current.getCenter();
        setCurrentView({ lat: center.lat, lng: center.lng });
      });

      mapInstance.current.on('zoomend', () => {
        setCurrentZoom(mapInstance.current.getZoom());
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [coords, name]);

  // Handle Heatmap Toggle
  useEffect(() => {
    if (!mapInstance.current) return;
    // @ts-ignore
    const L = window.L;

    if (showHeatmap) {
      // Prepare points for heatmap: [lat, lng, intensity]
      // Use location ratings or frequency to define intensity
      const heatPoints = allLocations
        .filter(l => l.coordinates)
        .map(l => [l.coordinates!.lat, l.coordinates!.lng, l.rating / 5]);

      // Add current location if not in list
      if (!allLocations.find(l => l.name === name)) {
        heatPoints.push([coords.lat, coords.lng, 1]);
      }

      if (!heatLayer.current) {
        // @ts-ignore
        heatLayer.current = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(mapInstance.current);
      }
    } else {
      if (heatLayer.current) {
        mapInstance.current.removeLayer(heatLayer.current);
        heatLayer.current = null;
      }
    }
  }, [showHeatmap, allLocations, coords, name]);

  const handleSaveView = () => {
    if (mapInstance.current && onSaveView) {
      const center = mapInstance.current.getCenter();
      const zoom = mapInstance.current.getZoom();
      onSaveView({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const adjustZoom = (delta: number) => {
    if (mapInstance.current) {
      mapInstance.current.setZoom(mapInstance.current.getZoom() + delta);
    }
  };

  const recenter = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([coords.lat, coords.lng], coords.zoom || 6);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#14181c] w-full max-w-4xl h-[70vh] rounded border border-[#2c3440] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="p-4 border-b border-[#2c3440] flex justify-between items-center bg-[#1b2228] z-10">
          <div>
            <h2 className="text-white font-black tracking-tighter text-lg italic uppercase">Travel Muse Map</h2>
            <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">{name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[9px] text-[#567] font-black uppercase tracking-widest">
                Lat: {currentView.lat.toFixed(4)} Lng: {currentView.lng.toFixed(4)}
              </p>
              <div className="w-1 h-1 rounded-full bg-[#567]"></div>
              <p className="text-[9px] text-[#567] font-black uppercase tracking-widest">
                Zoom: {currentZoom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all rounded-sm flex items-center gap-2 ${showHeatmap ? 'bg-[#ff8000] border-[#ff8000] text-white' : 'bg-transparent border-[#2c3440] text-[#9ab] hover:text-white'
                }`}
            >
              <i className="fas fa-fire"></i> {showHeatmap ? 'HEATMAP ON' : 'HEATMAP OFF'}
            </button>
            {onSaveView && (
              <Button
                variant={isSaved ? "success" : "ghost"}
                className={`!px-3 !py-1 !text-[10px] transition-all duration-300 ${isSaved ? 'scale-105' : ''}`}
                onClick={handleSaveView}
              >
                {isSaved ? (
                  <><i className="fas fa-check mr-1"></i> SAVED</>
                ) : (
                  <><i className="fas fa-save mr-1"></i> SAVE VIEW</>
                )}
              </Button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-sm bg-[#2c3440] flex items-center justify-center text-[#9ab] hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="flex-grow relative bg-[#0a0a0a]">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Custom Interactive Controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => adjustZoom(1)}
              className="w-10 h-10 bg-[#1b2228] border border-[#2c3440] text-white rounded shadow-xl flex items-center justify-center hover:bg-[#2c3440] transition-colors"
              title="Zoom In"
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              onClick={() => adjustZoom(-1)}
              className="w-10 h-10 bg-[#1b2228] border border-[#2c3440] text-white rounded shadow-xl flex items-center justify-center hover:bg-[#2c3440] transition-colors"
              title="Zoom Out"
            >
              <i className="fas fa-minus"></i>
            </button>
            <div className="h-4"></div>
            <button
              onClick={recenter}
              className="w-10 h-10 bg-[#00c030] text-white rounded shadow-xl flex items-center justify-center hover:bg-[#00e054] transition-colors animate-pulse"
              title="Recenter on Destination"
            >
              <i className="fas fa-crosshairs"></i>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-[#14181c]/60 backdrop-blur px-2 py-1 rounded text-[8px] font-black uppercase text-white/50 tracking-widest border border-white/5">
            Interactive Exploration Mode {showHeatmap && '• Density View'}
          </div>
        </div>

        <div className="p-2 bg-[#1b2228] text-center text-[9px] text-[#567] font-black uppercase tracking-[0.2em] border-t border-[#2c3440]">
          WanderLog Cartography &middot; Drag to pan &middot; Scroll to zoom
        </div>
      </div>
    </div>
  );
};
