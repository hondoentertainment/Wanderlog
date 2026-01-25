
import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

interface MapModalProps {
  name: string;
  coords: { lat: number; lng: number; zoom?: number };
  onClose: () => void;
  onSaveView?: (coords: { lat: number; lng: number; zoom: number }) => void;
}

export const MapModal: React.FC<MapModalProps> = ({ name, coords, onClose, onSaveView }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      const initialZoom = coords.zoom || 6;
      mapInstance.current = L.map(mapRef.current).setView([coords.lat, coords.lng], initialZoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      L.marker([coords.lat, coords.lng])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [coords, name]);

  const handleSaveView = () => {
    if (mapInstance.current && onSaveView) {
      const center = mapInstance.current.getCenter();
      const zoom = mapInstance.current.getZoom();
      onSaveView({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#14181c] w-full max-w-4xl h-[70vh] rounded border border-[#2c3440] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="p-4 border-b border-[#2c3440] flex justify-between items-center bg-[#1b2228] z-10">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">{name}</h3>
            <p className="text-[10px] text-[#567] font-black uppercase tracking-widest mt-1">Location Coordinates</p>
          </div>
          <div className="flex items-center gap-3">
            {onSaveView && (
              <Button variant="ghost" className="!px-3 !py-1 !text-[10px]" onClick={handleSaveView}>
                <i className="fas fa-save mr-1"></i> SAVE VIEW
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
        </div>

        <div className="p-2 bg-[#1b2228] text-center text-[9px] text-[#567] font-black uppercase tracking-[0.2em] border-t border-[#2c3440]">
           WanderLog Cartography
        </div>
      </div>
    </div>
  );
};
