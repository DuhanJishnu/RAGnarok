import { api } from "./api";

export const getRecentConversations = async (accessToken: string, page: number) => {
  const res = await api.get("/conv/v1/getrecentconv", {
    headers: { Authorization: accessToken },
    data: { page },
  });
  return res.data;
};
