"use client";

import useSWR from "swr";
import type { Config } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

// The Config singleton (settings, partner names/emails, date, chosen venue).
export function useConfig() {
  const { data, error, isLoading, mutate } = useSWR<Config>("/api/config", fetcher);

  async function update(values: Partial<Config>) {
    const res = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const updated = await res.json();
    await mutate(updated, { revalidate: false });
    return updated as Config;
  }

  return { config: data, isLoading, error, update, refresh: mutate };
}
