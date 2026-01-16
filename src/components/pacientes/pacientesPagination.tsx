"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Genera una paginación compacta:
 * Ej: 1 ... 4 5 6 ... 20
 */
function buildPages(current: number, total: number) {
  const pages: Array<number | "ellipsis"> = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("ellipsis");

  for (let i = left; i <= right; i++) pages.push(i);

  if (right < total - 1) pages.push("ellipsis");

  pages.push(total);

  return pages;
}

export default function PacientesPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}: Props) {
  const safePage = clamp(page, 1, Math.max(1, totalPages));
  const items = buildPages(safePage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {typeof totalItems === "number" ? (
        <p className="text-xs text-muted-foreground">
          Página {safePage} de {totalPages} · {totalItems} pacientes
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Página {safePage} de {totalPages}
        </p>
      )}

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={disabled || safePage === 1}
              className={disabled || safePage === 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (disabled || safePage === 1) return;
                onPageChange(safePage - 1);
              }}
            />
          </PaginationItem>

          {items.map((it, idx) =>
            it === "ellipsis" ? (
              <PaginationItem key={`e-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={it}>
                <PaginationLink
                  href="#"
                  isActive={it === safePage}
                  aria-disabled={disabled}
                  className={disabled ? "pointer-events-none opacity-70" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    if (disabled) return;
                    onPageChange(it);
                  }}
                >
                  {it}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={disabled || safePage === totalPages}
              className={disabled || safePage === totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (disabled || safePage === totalPages) return;
                onPageChange(safePage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
