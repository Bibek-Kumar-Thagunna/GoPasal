export interface GooglePlace {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface GoogleGeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
  city: string;
}

const getApiKey = () => process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
export const hasValidGoogleMapsKey = () => getApiKey() && getApiKey() !== "YOUR_GOOGLE_MAPS_API_KEY";

async function searchPlacesPhoton(query: string): Promise<GooglePlace[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !data.features) return [];
    
    return data.features.map((p: any) => {
      const props = p.properties;
      const mainText = props.name || props.city || props.town || props.state || "Unknown Location";
      const secondaryText = [props.street, props.city, props.state, props.country].filter(Boolean).join(', ');
      
      const lon = p.geometry.coordinates[0];
      const lat = p.geometry.coordinates[1];
      
      return {
        placeId: `PHOTON-${lat},${lon}`,
        description: `${mainText}, ${secondaryText}`,
        mainText: mainText,
        secondaryText: secondaryText
      };
    });
  } catch (error) {
    console.error("Photon search error:", error);
    return [];
  }
}

async function getPlaceDetailsPhoton(placeId: string): Promise<GoogleGeocodeResult | null> {
  if (placeId.startsWith('PHOTON-')) {
    const coords = placeId.replace('PHOTON-', '').split(',');
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lon = parseFloat(coords[1]);
      return reverseGeocodePhoton(lat, lon);
    }
  }
  return null;
}

async function reverseGeocodePhoton(lat: number, lon: number): Promise<GoogleGeocodeResult | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.features && data.features.length > 0) {
       const props = data.features[0].properties;
       const mainText = props.name || props.street || props.city || "Unknown";
       const secondaryText = [props.city || props.town, props.state, props.country].filter(Boolean).join(', ');
       
       return {
         latitude: lat,
         longitude: lon,
         formattedAddress: `${mainText}, ${secondaryText}`,
         placeId: `PHOTON-${props.osm_type}-${props.osm_id}`,
         city: props.city || props.town || props.county || 'Unknown'
       };
    }
    return null;
  } catch (error) {
    console.error("Photon reverse geocode error:", error);
    return null;
  }
}

export async function searchPlacesGoogle(query: string): Promise<GooglePlace[]> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    console.warn("Missing Google Maps API Key, falling back to Photon");
    return searchPlacesPhoton(query);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&components=country:np|country:in&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
      console.warn("Google Maps API failed, falling back to Photon", data.status);
      return searchPlacesPhoton(query);
    }

    if (data.status === "OK") {
      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || "",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error searching places:", error);
    return searchPlacesPhoton(query);
  }
}

export async function getPlaceDetails(placeId: string): Promise<GoogleGeocodeResult | null> {
  if (placeId.startsWith('PHOTON-') || placeId.startsWith('OSM-')) {
    return getPlaceDetailsPhoton(placeId);
  }

  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    return getPlaceDetailsPhoton(placeId); // Fallback if somehow we got a different ID without key
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,address_components&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
       // Cannot accurately fallback with a Google place_id without geocoding it, but we can try returning null
       return null;
    }

    if (data.status === "OK" && data.result) {
      const result = data.result;
      const cityComponent = result.address_components?.find((c: any) =>
        c.types.includes("locality") || c.types.includes("administrative_area_level_3")
      );

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId: placeId,
        city: cityComponent?.long_name || "Unknown",
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

export async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number
): Promise<GoogleGeocodeResult | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    return reverseGeocodePhoton(latitude, longitude);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
      return reverseGeocodePhoton(latitude, longitude);
    }

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const cityComponent = result.address_components?.find((c: any) =>
        c.types.includes("locality") || c.types.includes("administrative_area_level_3")
      );

      return {
        latitude,
        longitude,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        city: cityComponent?.long_name || "Unknown",
      };
    }
    // If google returns zero results, fallback
    if (data.status === "ZERO_RESULTS") {
      return reverseGeocodePhoton(latitude, longitude);
    }
    
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return reverseGeocodePhoton(latitude, longitude);
  }
}
