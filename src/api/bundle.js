import client from "./client";

// No purchaseBundle endpoint on purpose. Purchase records are written server
// side by PaymentService only after Razorpay confirms the payment.
export const getPurchaseByUserId = (userId) =>
  client.get(`/api/bundle/${userId}`);

export const checkPurchase = (userId) =>
  client.get(`/api/bundle/check/${userId}`);

export const checkMyPurchase = () =>
  client.get("/api/bundle/me");
