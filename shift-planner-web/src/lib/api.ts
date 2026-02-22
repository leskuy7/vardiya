import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearStoredAuth,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/lib/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/refresh", "/auth/register", "/auth/logout"];

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──── Refresh-token lock & queue ────
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

// Response interceptor — auto-refresh on 401 (single-flight)
api.interceptors.response.use(
  (response) => {
    const encoded = response?.headers?.["x-warnings"] as string | undefined;
    if (encoded && response?.data && typeof response.data === "object") {
      try {
        const decoded = JSON.parse(atob(encoded));
        if (Array.isArray(decoded)) {
          (response.data as { _warnings?: string[] })._warnings = decoded.map((w) => String(w));
        }
      } catch {
        // ignore decode errors
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = refreshResponse.data;
      setStoredAccessToken(accessToken);

      // Resolve all queued requests with the new token
      processQueue(null, accessToken);

      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
