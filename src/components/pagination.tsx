"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function Pagination({
  page,
  pages,
  total,
  setPage,
}: {
  page: number;
  pages: number;
  total: number;
  setPage: (page: number) => void;
}) {
  return (
    <div className="panel-footer">
      <span>
        {total} registro{total !== 1 ? "s" : ""}
      </span>
      <div className="row-actions">
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={13} />
        </button>
        <span>
          {page} / {pages}
        </span>
        <button
          className="icon-button"
          aria-label="Página siguiente"
          disabled={page === pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
