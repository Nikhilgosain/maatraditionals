/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showAppToast } from "@/utils/SnackbarUtils";
import Service from "@/lib/service";
import { API_ENDPOINTS, ROUTES, STATUS_CODE } from "@/utils/constant";
import { useLoaderStore } from "@/store/useLoaderStore";
import request from "@/lib/request";

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoaderStore();

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      showLoader();
      const res = await Service.post({
        url: API_ENDPOINTS.LOGIN,
        data: { email, password },
      });

      if (res.status !== STATUS_CODE.SUCCESS) {
        throw new Error(res.message || "Login failed");
      }

      if (typeof window !== "undefined" && res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      showAppToast("Login successful!", "success");

      // Delay before redirecting
      setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 2000);
      return res.user;
    } catch (err: any) {
      const message = err.message || "Something went wrong";
      showAppToast(message, "error");
      setError(message);
      return null;
    } finally {
      hideLoader();
    }
  };

  const logout = async () => {
    try {
      showLoader();

      const res = await request({
        method: "POST",
        url: API_ENDPOINTS.LOGOUT,
        withCredentials: true,
      });

      if (res.status !== 200) {
        throw new Error(res.message || "Logout failed");
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }

      showAppToast("Logged out successfully!", "success");
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      const message = err?.message || "Something went wrong during logout";
      showAppToast(message, "error");
    } finally {
      hideLoader();
    }
  };

  return { login, isLoading, error, logout };
};
