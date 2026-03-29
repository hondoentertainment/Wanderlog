import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { TravelLocation } from '../types';

interface GlobeViewProps {
  locations: TravelLocation[];
}

export const GlobeView: React.FC<GlobeViewProps> = ({ locations }) => {
  const globeRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Auto-rotate
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1.0;
      globeRef.current.controls().enableZoom = false; // Disable zoom to keep it looking like a header
      
      // Focus on the first location if available, otherwise default orientation
      if (locations.length > 0) {
        const firstWithCoords = locations.find(l => l.coordinates);
        if (firstWithCoords && firstWithCoords.coordinates) {
          globeRef.current.pointOfView({ lat: firstWithCoords.coordinates.lat, lng: firstWithCoords.coordinates.lng, altitude: 2 }, 1000);
        }
      }
    }
  }, [locations]);

  // Transform locations into globe points
  const gData = locations
    .filter(loc => loc.coordinates)
    .map(loc => ({
      lat: loc.coordinates!.lat,
      lng: loc.coordinates!.lng,
      size: loc.rating * 5,
      color: loc.isVisited ? '#00e054' : '#40bcf4',
      name: loc.name,
      rating: loc.rating,
      type: loc.type
    }));

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-move">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)" // Transparent to overlay on the background
          pointsData={gData}
          pointLabel={(d: any) => `
            <div class="bg-[#1b2228]/90 backdrop-blur border border-[#${d.color === '#00e054' ? '00e054' : '40bcf4'}] p-3 rounded-lg shadow-xl font-sans">
              <span class="text-[10px] font-black text-[#${d.color.slice(1)}] uppercase tracking-widest block mb-1">${d.type}</span>
              <strong class="text-white text-sm block">${d.name}</strong>
              <div class="flex items-center gap-1 mt-1 text-xs text-[#9ab]"><i class="fas fa-star text-yellow-500"></i> ${d.rating}/5</div>
            </div>
          `}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          pointsMerge={false}
        />
      )}
      
      {/* Ambient overlays to blend the globe into the UI */}
      <div className="absolute inset-0 pointer-events-none rounded-t-sm" style={{ boxShadow: 'inset 0 -40px 40px -20px #1b2228' }}></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#1b2228] via-transparent to-transparent"></div>
    </div>
  );
};
