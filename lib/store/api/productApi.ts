import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Product } from "@/types/storeTypes";
import type { RootState } from "@/lib/store";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getApiOrigin(): string | null {
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

function normalizeImageUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  if (typeof window === "undefined") {
    return raw;
  }

  const apiOrigin = getApiOrigin();

  if (raw.startsWith("//")) {
    return `${window.location.protocol}${raw}`;
  }

  if (raw.startsWith("/")) {
    return apiOrigin ? `${apiOrigin}${raw}` : `${window.location.origin}${raw}`;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw);
  if (!hasScheme) {
    if (!apiOrigin) return raw;
    return `${apiOrigin.replace(/\/$/, "")}/${raw.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(raw);
    if (!LOCAL_HOSTS.has(parsed.hostname)) return parsed.toString();

    if (apiOrigin) {
      const target = new URL(apiOrigin);
      parsed.protocol = target.protocol;
      parsed.hostname = target.hostname;
      parsed.port = target.port;
      return parsed.toString();
    }

    parsed.hostname = window.location.hostname;
    if (!parsed.port && window.location.port) {
      parsed.port = window.location.port;
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function normalizeImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item).trim())
      .map((item) => normalizeImageUrl(item))
      .filter((item) => item.length > 0);
  }

  const oneImage = toStringValue(value).trim();
  return oneImage ? [normalizeImageUrl(oneImage)] : [];
}

function normalizeProducts(payload: unknown): Product[] {
  let rawProducts: unknown[] = [];

  if (Array.isArray(payload)) {
    rawProducts = payload;
  } else if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      rawProducts = payload.data;
    } else if (isRecord(payload.data) && Array.isArray(payload.data.items)) {
      rawProducts = payload.data.items;
    } else if (Array.isArray(payload.items)) {
      rawProducts = payload.items;
    }
  }

  return rawProducts
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      id: toStringValue(item.id),
      name: toStringValue(item.name),
      price: toStringValue(item.price),
      images: normalizeImageList(item.images),
      category: toStringValue(item.category),
      badge: toStringValue(item.badge),
      rating: toStringValue(item.rating),
      meta: toStringValue(item.meta),
      href: toStringValue(item.href),
      surface: toStringValue(item.surface),
      glow: toStringValue(item.glow),
    }))
    .filter((item) => item.id && item.name);
}

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => ({
        url: "/products",
        method: "GET",
      }),
      transformResponse: (response: unknown) => normalizeProducts(response),
    }),
  }),
});

export const { useGetProductsQuery } = productApi;
