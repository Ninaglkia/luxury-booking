const PLACEHOLDER_VALUES = new Set([
  "",
  "your_google_maps_api_key",
  "your_google_map_id",
  "demo_map_id",
  "changeme",
  "replace_me",
  "todo",
]);

function sanitizeEnvValue(value: string | undefined): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) return "";
  if (PLACEHOLDER_VALUES.has(normalized.toLowerCase())) return "";
  return normalized;
}

export type GoogleMapsClientConfig = {
  apiKey: string;
  mapId?: string;
};

export function getGoogleMapsClientConfig(): GoogleMapsClientConfig {
  const apiKey = sanitizeEnvValue(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const mapId = sanitizeEnvValue(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID);

  return {
    apiKey,
    ...(mapId ? { mapId } : {}),
  };
}
