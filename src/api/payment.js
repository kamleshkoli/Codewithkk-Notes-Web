import client from "./client";

export const createOrder = (amount) =>
  client.post("/api/payment/create-order", { amount });

export const verifyPayment = (data) =>
  client.post("/api/payment/verify", data);
