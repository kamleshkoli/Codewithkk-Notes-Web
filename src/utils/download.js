const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function openUrl(url) {
  const a = document.createElement("a");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadNote(note) {
  if (!note || !note.id) return;
  openUrl(`${API_BASE}/api/notes/${note.id}/download`);
}
