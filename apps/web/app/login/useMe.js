"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api";

export function useMe() {
  const [me, setMe] = useState(undefined); // undefined=loading, null=not logged in, object=user

  useEffect(() => {
    apiGet("/auth/me")
      .then((res) => {
        // ✅ FIX: Backend returns { data: { id, name, role, email } }
        // Old code did setMe(data) which set me = { data: {...} }
        // So me.role was undefined → every page showed "Forbidden"
        setMe(res?.data ?? null);
      })
      .catch(() => setMe(null));
  }, []);

  return me;
}