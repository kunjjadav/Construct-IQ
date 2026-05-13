import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "../components/ui/Toast";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (
      config.method &&
      ["post", "put", "patch", "delete"].includes(config.method.toLowerCase())
    ) {
      config.headers["Idempotency-Key"] = uuidv4();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let last429ToastTime = 0;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint = requestUrl.includes("/api/auth/");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      toast("Your session has expired. Please log in again.", "warning");
      useAuthStore.getState().logout();
    } else if (error.response?.status === 429) {
      const now = Date.now();
      if (now - last429ToastTime > 5000) {
        toast("You are making too many requests. Please slow down.", "error");
        last429ToastTime = now;
      }
    } else if (error.response?.status >= 500) {
      toast("A server error occurred. Our team has been notified.", "error");
    }

    return Promise.reject(error);
  },
);

export default api;
