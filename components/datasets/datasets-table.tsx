'use client'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dataset } from '@/lib/types'
import { ClassificationBadge } from '../classification'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { EmptyState } from '../ui/feedback'
import { Input } from '../ui/input'
import { cn } from '../ui/utils'

const columnHelper = createColumnHelper<Dataset>()

function readinessTone(readiness: Dataset['modelReadiness']) {
  return readiness === 'Ready' ? 'positive' : readiness === 'Review' ? 'warning' : 'danger'
}

export function DatasetsTable({ datasets }: { datasets: Dataset[] }) {
  const [filter, setFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Dataset',
        cell: (info) => (
          <Link href={`/datasets/${info.row.original.id}`} className="font-medium">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('source', { header: 'Source' }),
      columnHelper.accessor('department', { header: 'Department' }),
      columnHelper.accessor('geography', { header: 'Geography' }),
      columnHelper.accessor('classification', {
        header: 'Classification',
        cell: (info) => <ClassificationBadge classification={info.getValue()} />,
      }),
      columnHelper.accessor('freshness', { header: 'Freshness' }),
      columnHelper.accessor('quality', { header: 'Quality' }),
      columnHelper.accessor('modelReadiness', {
        header: 'Model readiness',
        cell: (info) => <Badge tone={readinessTone(info.getValue())}>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('licence', { header: 'Licence' }),
      columnHelper.accessor('version', { header: 'Version' }),
    ],
    [],
  )

  const table = useReactTable({
    data: datasets,
    columns,
    state: { globalFilter: filter, sorting },
    onGlobalFilterChange: setFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <label htmlFor="dataset-filter" className="sr-only">
          Filter datasets
        </label>
        <Input
          id="dataset-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, source, department…"
          className="h-10 text-sm"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No datasets match that filter"
          description="Try a different search term, or clear the filter to see the full catalogue."
        />
      ) : (
        <>
          {/* Table from md up */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-[13px]">
                <caption className="sr-only">
                  Governed dataset catalogue with source, classification, quality and model
                  readiness.
                </caption>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="bg-canvas">
                      {headerGroup.headers.map((header) => {
                        const sorted = header.column.getIsSorted()
                        return (
                          <th
                            key={header.id}
                            scope="col"
                            aria-sort={
                              sorted === 'asc'
                                ? 'ascending'
                                : sorted === 'desc'
                                  ? 'descending'
                                  : 'none'
                            }
                            className="border-b border-line px-3 py-2.5 text-left text-xs font-medium text-muted"
                          >
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="flex items-center gap-1 hover:text-ink"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <ArrowUpDown
                                className={cn('h-3 w-3', sorted ? 'text-civic' : 'text-line-strong')}
                                aria-hidden="true"
                              />
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-canvas">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="border-b border-line-soft px-3 py-2.5 text-ink">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stacked cards below md */}
          <ul className="space-y-2.5 md:hidden">
            {rows.map((row) => {
              const dataset = row.original
              return (
                <li key={dataset.id}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/datasets/${dataset.id}`} className="text-sm font-semibold">
                        {dataset.name}
                      </Link>
                      <Badge tone={readinessTone(dataset.modelReadiness)}>
                        {dataset.modelReadiness}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      {dataset.source} · {dataset.department} · {dataset.geography}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <ClassificationBadge classification={dataset.classification} />
                      <span className="text-xs text-faint">
                        {dataset.freshness} · Quality {dataset.quality} · v{dataset.version}
                      </span>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
