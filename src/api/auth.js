import client from "./client";

export const register = (data) =>
  client.post("/api/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
  });

export const login = (data) =>
  client.post("/api/auth/login", {
    email: data.email,
    password: data.password,
  });

export const getMe = () =>
  client.get("/api/user/me");
