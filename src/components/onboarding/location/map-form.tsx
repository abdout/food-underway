"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { type LocationFormData } from "./validation";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface MapFormProps {
  initialData?: Partial<LocationFormData>;
  onLocationChange: (data: LocationFormData) => void;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 16);
  }, [map, center]);
  
  return null;
}

export function MapForm({ initialData, onLocationChange }: MapFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationFormData>({
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    latitude: initialData?.latitude || 40.7128,
    longitude: initialData?.longitude || -74.0060,
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for locations using Nominatim (OpenStreetMap)
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchLocations(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, searchLocations]);

  // Handle location selection from search results
  const handleLocationSelect = (result: SearchResult) => {
    const newLocation: LocationFormData = {
      address: [
        result.address?.house_number,
        result.address?.road,
      ].filter(Boolean).join(" ") || result.display_name.split(",")[0],
      city: result.address?.city || result.address?.state || "",
      state: result.address?.state || "",
      country: result.address?.country || "",
      postalCode: result.address?.postcode || "",
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    setSelectedLocation(newLocation);
    onLocationChange(newLocation);
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  // Handle map click to set location
  const handleMapClick = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      // Reverse geocoding to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const newLocation: LocationFormData = {
          address: [
            data.address?.house_number,
            data.address?.road,
          ].filter(Boolean).join(" ") || data.display_name.split(",")[0],
          city: data.address?.city || data.address?.state || "",
          state: data.address?.state || "",
          country: data.address?.country || "",
          postalCode: data.address?.postcode || "",
          latitude: lat,
          longitude: lng,
        };

        setSelectedLocation(newLocation);
        onLocationChange(newLocation);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input with Autocomplete */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <Card className="absolute top-full mt-1 w-full z-50 max-h-60 overflow-auto">
            <div className="p-1">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                >
                  <div className="text-sm font-medium">{result.display_name.split(",")[0]}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.display_name.split(",").slice(1).join(",")}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Interactive Map */}
      <div className="rounded-lg overflow-hidden border h-[400px]">
        <MapContainer
          center={[selectedLocation.latitude!, selectedLocation.longitude!]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          onClick={(e) => handleMapClick(e.latlng.lat, e.latlng.lng)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[selectedLocation.latitude!, selectedLocation.longitude!]} />
          <MapController center={[selectedLocation.latitude!, selectedLocation.longitude!]} />
        </MapContainer>
      </div>

      {/* Selected Location Display */}
      {selectedLocation.address && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-1">
            <p className="text-sm font-medium">Selected Location</p>
            <p className="text-xs text-muted-foreground">
              {selectedLocation.address}
              {selectedLocation.city && `, ${selectedLocation.city}`}
              {selectedLocation.state && `, ${selectedLocation.state}`}
              {selectedLocation.country && `, ${selectedLocation.country}`}
              {selectedLocation.postalCode && ` ${selectedLocation.postalCode}`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}