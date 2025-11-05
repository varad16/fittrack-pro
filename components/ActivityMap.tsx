'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Position {
  lat: number
  lng: number
}

interface ActivityMapProps {
  positions: Position[]
}

// Component to update map view when positions change
function MapUpdater({ positions }: { positions: Position[] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      const latestPosition = positions[positions.length - 1]
      map.setView([latestPosition.lat, latestPosition.lng], 15)
    }
  }, [positions, map])

  return null
}

export default function ActivityMap({ positions }: ActivityMapProps) {
  // Default center (Los Angeles)
  const defaultCenter: [number, number] = [34.0522, -118.2437]
  
  const center: [number, number] = positions.length > 0
    ? [positions[positions.length - 1].lat, positions[positions.length - 1].lng]
    : defaultCenter

  const pathPositions: [number, number][] = positions.map(p => [p.lat, p.lng])

  return (
    <MapContainer
      center={center}
      zoom={positions.length > 0 ? 16 : 13}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Update map center when positions change */}
      <MapUpdater positions={positions} />
      
      {positions.length > 0 && (
        <>
          {/* Draw route */}
          {pathPositions.length > 1 && (
            <Polyline positions={pathPositions} color="blue" weight={4} />
          )}
          
          {/* Start marker (green) */}
          <Marker 
            position={[positions[0].lat, positions[0].lng]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>Start</Popup>
          </Marker>
          
          {/* Current position marker (red) */}
          {positions.length > 1 && (
            <Marker 
              position={[positions[positions.length - 1].lat, positions[positions.length - 1].lng]}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>Current Position</Popup>
            </Marker>
          )}
        </>
      )}
    </MapContainer>
  )
}