import client from "../api/client";

/**
 * Downloads through the authenticated API client.
 *
 * This must not be a plain <a href> navigation: the JWT lives in localStorage
 * and is sent as an Authorization header by axios, which a browser navigation
 * cannot attach. The server gates this endpoint on both a valid token and a
 * completed purchase.
 */
export async function downloadNote(note) {
  if (!note || !note.id) return;
  let res;
  try {
    res = await client.get(`/api/notes/${note.id}/download`, {
      responseType: "blob",
    });
  } catch (err) {
    // The endpoint needs both a valid token and a completed purchase.
    const status = err.response?.status;
    if (status === 401) {
      alert("Please sign in to download this PDF.");
    } else if (status === 403) {
      alert("Purchase this bundle to unlock the download.");
    } else {
      alert("Download failed. Please try again.");
    }
    return;
  }

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(note.title || "notes").replace(/[^a-z0-9._-]+/gi, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
