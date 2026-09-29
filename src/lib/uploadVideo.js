import { supabase } from "./supabaseClient";

// Uploads an admin-picked video (the homepage header) to the `media` bucket
// and returns its public URL. Unlike pictures there's no resizing in the
// browser, so the size cap is what keeps a phone's raw 4K recording out.
const MAX_BYTES = 50 * 1024 * 1024;

export async function uploadVideo(file, folder = "site-content") {
  if (!file) throw new Error("No file selected.");
  if (!file.type?.startsWith("video/")) throw new Error("That file isn't a video.");
  if (file.size > MAX_BYTES) throw new Error("Videos must be 50MB or smaller — 20MB or less plays best.");
  const ext = (file.name?.split(".").pop() || "mp4").toLowerCase().slice(0, 5);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
