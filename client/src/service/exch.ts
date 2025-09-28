import { api } from "./api";

// Get Exchanges
export const getExchanges = async (
  accessToken: string,
  conversationId: string,
  page: number
) => {
  const res = await api.get("/exch/v1/getexch", {
    headers: { Authorization: accessToken },
    data: { conversationId, page },
  });
  return res.data;
};

// Create Exchange
export const createExchange = async (
  accessToken: string,
  user_query: string,
  convId?: string,
  convTitle?: string,
  image?: File
) => {
  const formData = new FormData();
  formData.append("user_query", user_query);
  if (convId) formData.append("convId", convId);
  if (convTitle) formData.append("convTitle", convTitle);
  if (image) formData.append("image", image);
  const res = await api.post("/exch/v1/createexch", formData, {
    headers: {
      Authorization: accessToken, 
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
