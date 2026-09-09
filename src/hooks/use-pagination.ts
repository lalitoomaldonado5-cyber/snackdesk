"use client";
import { useState } from "react";
export function usePagination<T>(items: T[], size = 10) {
  const [requestedPage, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(requestedPage, pages);
  return {
    rows: items.slice((page - 1) * size, page * size),
    page,
    pages,
    total: items.length,
    setPage,
  };
}
