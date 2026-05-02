"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("recyconnect_admin_token");
    localStorage.removeItem("recyconnect_refresh_token");
    localStorage.removeItem("recyconnect_admin_name");
    setToken("");
    setIsAuthenticated(false);
    setLoginEmail("");
    setLoginPassword("");
    setAdminName("");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginEmail, password: loginPassword }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        setLoginError(json?.error?.message || json?.message || "Login failed. Check your credentials.");
        setLoginLoading(false);
        return;
      }

      const accessToken = json?.data?.accessToken || json?.accessToken;
      const role = json?.data?.user?.role || json?.user?.role || json?.data?.role || json?.role;
      const name = json?.data?.user?.name || json?.user?.name || json?.data?.name || json?.name || "Admin";
      const refreshToken = json?.data?.refreshToken || json?.refreshToken;

      if (role !== "admin") {
        setLoginError(`Access denied. Admin role required. (Got: ${role || 'unknown'})`);
        setLoginLoading(false);
        return;
      }

      if (!accessToken) {
        setLoginError("No access token received from server.");
        setLoginLoading(false);
        return;
      }

      localStorage.setItem("recyconnect_admin_token", accessToken);
      if (refreshToken) localStorage.setItem("recyconnect_refresh_token", refreshToken);
      localStorage.setItem("recyconnect_admin_name", name);

      setToken(accessToken);
      setAdminName(name);
      setIsAuthenticated(true);
      setLoginError("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Connection failed. Is the backend running?");
    }
    setLoginLoading(false);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("recyconnect_admin_token");
    const savedName = localStorage.getItem("recyconnect_admin_name");

    if (savedToken) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((json) => {
          const role = json?.data?.role || json?.role;
          if (role === "admin") {
            setToken(savedToken);
            setAdminName(savedName || json?.data?.name || "Admin");
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout())
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isAuthenticated,
    authChecked,
    token,
    adminName,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    loginError,
    loginLoading,
    handleLogin,
    handleLogout
  };
}
