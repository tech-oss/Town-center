import { supabase } from "./supabaseClient";

// Uploads an admin-picked image to the `media` bucket and returns its public
// URL, which is what the content columns store.
//
// This replaced reading the file into a base64 data URL: those inflate the
// stored value by about a third of the file size, sit inside the jsonb
// documents the guide and page editors write, and ship again in full on every
// read of the row.
//
// `folder` keeps the bucket browsable (guides/, events/, the-future/ …).

const MAX_BYTES = 8 * 1024 * 1024;

function extensionFor(file) {
  const fromName = file.name?.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  if (fromName && fromName.length <= 5) return fromName;
  return (file.type?.split("/")[1] ?? "jpg").toLowerCase();
}

export async function uploadImage(file, folder = "uploads") {
  if (!file) throw new Error("No file selected.");
  if (!file.type?.startsWith("image/")) throw new Error("That file isn't an image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 8MB or smaller.");

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
