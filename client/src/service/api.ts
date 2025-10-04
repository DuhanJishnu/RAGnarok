import axios from 'axios';

const BASEURL = process.env.NEXT_PUBLIC_BASEURL;

// separate axios instance for refresh token calls
const refreshApi = axios.create({
  baseURL: `${BASEURL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Create Axios instance
export const api = axios.create({
  baseURL: `${BASEURL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Track if token refresh is in progress to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for handling token refresh
 api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log(error);
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If token refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using separate instance to avoid recursion
        await refreshApi.get("/auth/v1/refresh");
        console.log('Token refreshed successfully');
        
        // Process all queued requests
        processQueue(null, 'token_refreshed');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Process all queued requests with error
        processQueue(refreshError, null);
        
        // If refresh fails, redirect to login (but only if not already on the below pages)
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
