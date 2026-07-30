import client from "./client";

export const getUserProfile = (userId) =>
  client.get(`/api/user/profile/${userId}`);

export const updateUserProfile = (userId, data) =>
  client.put(`/api/user/profile/${userId}`, data);
