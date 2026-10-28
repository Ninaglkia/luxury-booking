export function getGoogleMapsClientConfig() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() ?? "";

  return {
    apiKey,
    mapId: mapId && mapId !== "DEMO_MAP_ID" ? mapId : undefined,
  };
}
