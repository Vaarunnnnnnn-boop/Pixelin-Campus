"use client";

import { useEffect } from "react";
import { apiGet } from "./lib/api";

export default function Home() {
  useEffect(() => {
    apiGet("/auth/me")
      .then((me) => {
        if (!me) return (window.location.href = "/login");
        const dash =
          me.role === "ADMIN" ? "/admin" :
          me.role === "FACULTY" ? "/faculty" :
          "/student";
        window.location.href = dash;
      })
      .catch(() => (window.location.href = "/login"));
  }, []);

  return <p style={{ padding: 24 }}>Redirecting...</p>;
}