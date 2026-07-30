import client from "./client";

export const purchaseBundle = (data) =>
  client.post("/api/bundle/purchase", {
    userId: data.userId,
    paymentId: data.paymentId,
    orderId: data.orderId,
    amount: data.amount,
    purchaseDate: data.purchaseDate,
    status: data.status,
  });

export const getPurchaseByUserId = (userId) =>
  client.get(`/api/bundle/${userId}`);

export const checkPurchase = (userId) =>
  client.get(`/api/bundle/check/${userId}`);
