import  api  from "./api";

// Signup
export const signup = async (fullname: string, email: string, password: string) => {
  const res = await api.post("/auth/v1/signup", { fullname, email, password });
  return res.data;
};

// Login
export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/v1/login", { email, password });
  return res.data;
};

// Logout
export const logout = async () => {
  const res = await api.post("/auth/v1/logout");
  return res.data;
};

// Refresh Token
export const refreshToken = async () => {
  const res = await api.get("/auth/v1/refresh");
  return res.data;
};

// Me (Authenticated)
export const getMe = async () => {
  const res = await api.get("/auth/v1/me");
  return res.data;
};

