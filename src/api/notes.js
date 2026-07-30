import client from "./client";

export const getAllNotes = () => client.get("/api/notes");

export const getNoteById = (id) => client.get(`/api/notes/${id}`);

export const createNote = (note) => client.post("/api/notes", note);

export const updateNote = (id, note) => client.put(`/api/notes/${id}`, note);

export const deleteNote = (id) => client.delete(`/api/notes/${id}`);
