import { api } from "./api";

// Get Exchanges
export const getExchanges = async (
  //accessToken: string,
  conversationId: string,
  page: number
) => {
  const res = await api.post("/exch/v1/getexch", {
    //headers: { Authorization: accessToken },
    data: { conversationId, page },
  });
  console.log("res data : ", res.data);
  return res.data;
};

// Create Exchange
export const createExchange = async (
  user_query: string,
  convId?: string,
  convTitle?: string,
  image?: File
) => {
  
  const res = await api.post("/exch/v1/createexch", {
    user_query,
    convId,
    convTitle,
  });
  return res.data;
};
