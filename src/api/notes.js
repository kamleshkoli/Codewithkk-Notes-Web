import client from "./client";

// Read-only. Catalogue writes live under /api/admin/notes and require ADMIN.
export const getAllNotes = () => client.get("/api/notes");

export const getNoteById = (id) => client.get(`/api/notes/${id}`);
