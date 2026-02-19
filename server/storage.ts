// Storage helpers backed by Supabase Storage.
// Bucket name: "uploads" (deve essere creato nella dashboard Supabase → Storage → New bucket)

import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

const BUCKET = "uploads";

function getStorage() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "Storage config missing: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabase.storage.from(BUCKET);
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const storage = getStorage();

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as Uint8Array], { type: contentType });

  const { error } = await storage.upload(key, blob, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = storage.getPublicUrl(key);
  return { key, url: urlData.publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const storage = getStorage();
  const { data } = storage.getPublicUrl(key);
  return { key, url: data.publicUrl };
}
