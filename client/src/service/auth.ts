import { api } from "./api";

// Signup
export const signup = async (username: string, email: string, password: string) => {
  const res = await api.post("/auth/v1/signup", { username, email, password });
  return res.data;
};

// Login
export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/v1/login", { email, password });
  return res.data;
};

// Refresh Token (⚠️ GET but expects body → better use POST if backend allows)
export const refreshToken = async (refresh_token: string) => {
  const res = await api.get("/auth/v1/refresh", { data: { refresh_token } });
  return res.data;
};

// Me (Authenticated)
export const getMe = async (accessToken: string) => {
  const res = await api.get("/auth/v1/me", {
    headers: { Authorization: accessToken },
  });
  return res.data;
};

