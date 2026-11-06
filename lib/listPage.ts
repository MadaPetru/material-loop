/** Simple client-side paging helpers for admin / long lists. */

export const DEFAULT_PAGE_SIZE = 10;

export function pageCount(total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

export function clampPage(page: number, total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  const pages = pageCount(total, pageSize);
  return Math.min(Math.max(1, page), pages);
}

export function slicePage<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE): T[] {
  const safe = clampPage(page, items.length, pageSize);
  const start = (safe - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
