"use client";

import useSWR from "swr";
import type { EntitySlug } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

// Pull a human-readable message out of a failed write response, falling back to
// a generic one so toasts/inline errors never show "[object Object]".
async function failure(res: Response, action: string): Promise<Error> {
  let message = `Couldn't ${action}. Please try again.`;
  try {
    const body = await res.json();
    if (body?.error && typeof body.error === "string") message = body.error;
  } catch {
    /* non-JSON body — keep the generic message */
  }
  return new Error(message);
}

// The single client data layer. Every module reads/writes through this hook —
// no scattered fetch calls. Same shape regardless of entity.
export function useEntity<T extends { id: number }>(slug: EntitySlug) {
  const key = `/api/${slug}`;
  const { data, error, isLoading, mutate } = useSWR<T[]>(key, fetcher);

  async function create(values: Partial<T>) {
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw await failure(res, "save this");
    await mutate();
  }

  async function update(id: number, values: Partial<T>) {
    const res = await fetch(`${key}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw await failure(res, "save this");
    await mutate();
  }

  async function remove(id: number) {
    const res = await fetch(`${key}/${id}`, { method: "DELETE" });
    if (!res.ok) throw await failure(res, "delete this");
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
