type NominatimResult = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    country?: string;
  };
};

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ address: string; city: string }> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GoPasal/2.0 (customer-app)",
    },
  });

  if (!res.ok) {
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: "Nepal",
    };
  }

  const data = (await res.json()) as NominatimResult;
  const addr = data.address;
  const city =
    addr?.city ??
    addr?.town ??
    addr?.village ??
    addr?.suburb ??
    addr?.state ??
    "Nepal";

  return {
    address: data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    city,
  };
}
