"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api";

export function useMe() {
  const [me, setMe] = useState(undefined); // undefined=loading, null=not logged in, object=user

  useEffect(() => {
    apiGet("/auth/me")
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  return me;
}