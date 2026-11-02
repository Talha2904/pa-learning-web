import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Optional explicit sort value when the key is not a property on the row. */
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  /** Rendered as the card title on phones (one column should set this). */
  primary?: boolean;
  /** Hide on phone cards (e.g. action buttons rendered separately). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  /** Actions shown at the bottom of each phone card. */
  mobileActions?: (row: T) => ReactNode;
}

function searchableText(value: unknown): string {
  if (value == null || typeof value === 'function') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(searchableText).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(searchableText).join(' ');
  return '';
}

function sortAtom<T>(row: T, column: Column<T>): string | number | boolean {
  const explicit = column.sortValue?.(row);
  const raw = explicit !== undefined ? explicit : (row as unknown as Record<string, unknown> | null)?.[column.key];
  if (typeof raw === 'number' || typeof raw === 'boolean') return raw;
  return searchableText(raw).toLocaleLowerCase();
}

/** Responsive, searchable and sortable table with compact pagination controls. */
export function DataTable<T>({ columns, rows, rowKey, empty, mobileActions }: DataTableProps<T>) {
  const [term, setTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredRows = useMemo(() => {
    const needle = term.trim().toLocaleLowerCase();
    let result = needle
      ? rows.filter((row) => searchableText(row).toLocaleLowerCase().includes(needle))
      : [...rows];
    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      if (column) {
        result = [...result].sort((a, b) => {
          const av = sortAtom(a, column);
          const bv = sortAtom(b, column);
          const comparison = typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
          return sort.direction === 'asc' ? comparison : -comparison;
        });
      }
    }
    return result;
  }, [rows, term, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const primary = columns.find((c) => c.primary) ?? columns[0]!;

  const changeTerm = (value: string) => { setTerm(value); setPage(1); };
  const changePageSize = (value: number) => { setPageSize(value); setPage(1); };
  const toggleSort = (column: Column<T>) => {
    setSort((current) => current?.key === column.key
      ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key: column.key, direction: 'asc' });
    setPage(1);
  };

  if (rows.length === 0) return <div className="pa-table-empty px-6 py-10 text-center text-[13px] text-faint">{empty ?? 'Nothing to show.'}</div>;

  return (
    <section className="pa-table-card min-w-0 overflow-hidden">
      <div className="pa-table-toolbar flex flex-wrap items-center justify-between gap-3">
        <label className="pa-search-wrap flex min-w-0 flex-1 items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <input type="search" value={term} onChange={(event) => changeTerm(event.target.value)} placeholder="Search records…" aria-label="Search table records" />
          {term ? <button type="button" className="pa-search-clear" onClick={() => changeTerm('')} aria-label="Clear search">×</button> : null}
        </label>
        <label className="pa-size-wrap flex items-center gap-2">
          <span>Rows per page</span>
          <select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))} aria-label="Rows per page">
            {[5, 10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div className="pa-data-table hidden overflow-x-auto md:block">
        <table className="pa-data-table-grid w-full border-collapse text-[13px]">
          <thead><tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return <th key={column.key} scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="pa-sort-button" onClick={() => toggleSort(column)}>
                  <span>{column.header}</span><span className={cn('pa-sort-indicator', active && 'is-active')} aria-hidden="true">{active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </button>
              </th>;
            })}
          </tr></thead>
          <tbody>
            {visibleRows.map((row) => <tr key={rowKey(row)} className="pa-data-row">
              {columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>

      <ul className="pa-mobile-data-list divide-y divide-line md:hidden">
        {visibleRows.map((row) => <li key={rowKey(row)}>
          <div className="mb-2">{primary.render(row)}</div>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
            {columns.filter((column) => column !== primary && !column.hideOnMobile && column.header).map((column) => <div key={column.key} className="contents">
              <dt className="pt-0.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-faint">{column.header}</dt>
              <dd className="min-w-0">{column.render(row)}</dd>
            </div>)}
          </dl>
          {mobileActions ? <div className="mt-3 flex flex-wrap gap-2">{mobileActions(row)}</div> : null}
        </li>)}
      </ul>

      {visibleRows.length === 0 ? <div className="pa-table-empty">No records match “{term}”. Try another search.</div> : null}
      <footer className="pa-table-footer flex flex-wrap items-center justify-between gap-3">
        <span className="pa-result-info">Showing <strong>{filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> records</span>
        <div className="pa-page-actions flex items-center gap-2">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>‹ Previous</button>
          <span className="pa-page-current">Page {currentPage} of {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>Next ›</button>
        </div>
      </footer>
    </section>
  );
}
