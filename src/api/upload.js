import client from "./client";

export const uploadPdf = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return client.post("/api/upload/pdf", formData, {
    headers: { "Content-Type": undefined },
  });
};

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return client.post("/api/upload/image", formData, {
    headers: { "Content-Type": undefined },
  });
};
