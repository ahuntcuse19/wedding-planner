"use client";

import useSWR from "swr";
import type { EntitySlug } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

// The single client data layer. Every module reads/writes through this hook —
// no scattered fetch calls. Same shape regardless of entity.
export function useEntity<T extends { id: number }>(slug: EntitySlug) {
  const key = `/api/${slug}`;
  const { data, error, isLoading, mutate } = useSWR<T[]>(key, fetcher);

  async function create(values: Partial<T>) {
    await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    await mutate();
  }

  async function update(id: number, values: Partial<T>) {
    await fetch(`${key}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    await mutate();
  }

  async function remove(id: number) {
    await fetch(`${key}/${id}`, { method: "DELETE" });
    await mutate();
  }

  return {
    data: data ?? [],
    isLoading,
    error,
    create,
    update,
    remove,
    refresh: mutate,
  };
}
