// @ts-nocheck
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  FileText, ArrowDownToLine, ArrowUpFromLine, CheckCircle, XCircle,
  Clock, AlertTriangle, ChevronLeft, ChevronRight, X, Search, Filter,
  Loader2
} from 'lucide-react'

const PAGE_SIZE = 25

const VOUCHER_TYPES = [
  'All', 'Sales', 'Purchase', 'Receipt', 'Payment',
  'Journal', 'Contra', 'DebitNote', 'CreditNote',
]

const SYNC_STATUSES = ['All', 'synced', 'pending', 'failed', 'conflict']

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(val || 0)
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function truncate(str: string | null, len = 40) {
  if (!str) return '-'
  return str.length > len ? str.slice(0, len) + '...' : str
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    synced: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    conflict: 'bg-orange-100 text-orange-700',
  }
  const icons = {
    synced: <CheckCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    conflict: <AlertTriangle className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {icons[status] || null}
      {status}
    </span>
  )
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === 'from_tally') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <ArrowDownToLine className="h-3 w-3" /> From Tally
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <ArrowUpFromLine className="h-3 w-3" /> To Tally
    </span>
  )
}

function DetailModal({ voucher, onClose }: { voucher: any; onClose: () => void }) {
  const entries = Array.isArray(voucher.ledger_entries) ? voucher.ledger_entries : []
  const totalDebit = entries.filter(e => e.is_debit).reduce((s, e) => s + Math.abs(e.amount || 0), 0)
  const totalCredit = entries.filter(e => !e.is_debit).reduce((s, e) => s + Math.abs(e.amount || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Voucher Details
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Voucher Number</p>
              <p className="font-medium text-gray-900">{voucher.voucher_number || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{voucher.voucher_type}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(voucher.date)}</p>
            </div>
            <div>
              <p className="text-gray-500">Party</p>
              <p className="font-medium text-gray-900">{voucher.party_ledger || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(voucher.amount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusBadge status={voucher.sync_status} />
                <DirectionBadge direction={voucher.sync_direction} />
              </div>
            </div>
          </div>

          {voucher.narration && (
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Narration</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{voucher.narration}</p>
            </div>
          )}

          {voucher.is_cancelled && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              This voucher is cancelled.
            </div>
          )}

          {voucher.error_message && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              <span className="font-medium">Error:</span> {voucher.error_message}
            </div>
          )}

          {voucher.adamrit_bill_id && (
            <div className="text-sm">
              <p className="text-gray-500">Linked Bill ID: <span className="font-mono text-gray-900">{voucher.adamrit_bill_id}</span></p>
            </div>
          )}
          {voucher.adamrit_payment_id && (
            <div className="text-sm">
              <p className="text-gray-500">Linked Payment ID: <span className="font-mono text-gray-900">{voucher.adamrit_payment_id}</span></p>
            </div>
          )}

          {voucher.synced_at && (
            <div className="text-sm text-gray-500">
              Last synced: {new Date(voucher.synced_at).toLocaleString('en-IN')}
            </div>
          )}

          {/* Ledger Entries Table */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Ledger Entries</h4>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">No ledger entries available.</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Ledger</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">Debit</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 text-gray-900">{entry.ledger || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-900">
                          {entry.is_debit ? formatCurrency(Math.abs(entry.amount || 0)) : ''}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900">
                          {!entry.is_debit ? formatCurrency(Math.abs(entry.amount || 0)) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="py-2 px-3 text-gray-900">Total</td>
                      <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(totalDebit)}</td>
                      <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TallyVouchers({ serverUrl, companyName }: { serverUrl?: string; companyName?: string }) {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modal
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tally_vouchers')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)
      if (typeFilter !== 'All') query = query.eq('voucher_type', typeFilter)
      if (statusFilter !== 'All') query = query.eq('sync_status', statusFilter)

      const { data, count, error } = await query

      if (error) {
        toast.error('Failed to load vouchers: ' + error.message)
        setVouchers([])
        setTotalCount(0)
      } else {
        setVouchers(data || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      toast.error('Failed to load vouchers')
    }
    setLoading(false)
  }, [page, dateFrom, dateTo, typeFilter, statusFilter])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0)
  }, [dateFrom, dateTo, typeFilter, statusFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Voucher Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {VOUCHER_TYPES.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sync Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SYNC_STATUSES.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Vouchers
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({totalCount.toLocaleString()} total)
            </span>
          </h3>
          {loading && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2.5 px-3 text-gray-600 font-medium">Date</th>
                <th className="text-left py-2.5 px-3 text-gray-600 font-medium">Number</th>
                <th className="text-left py-2.5 px-3 text-gray-600 font-medium">Type</th>
                <th className="text-left py-2.5 px-3 text-gray-600 font-medium">Party</th>
                <th className="text-right py-2.5 px-3 text-gray-600 font-medium">Amount</th>
                <th className="text-left py-2.5 px-3 text-gray-600 font-medium">Narration</th>
                <th className="text-center py-2.5 px-3 text-gray-600 font-medium">Status</th>
                <th className="text-center py-2.5 px-3 text-gray-600 font-medium">Direction</th>
              </tr>
            </thead>
            <tbody>
              {!loading && vouchers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No vouchers found. Adjust your filters or sync vouchers from Tally.
                  </td>
                </tr>
              )}
              {vouchers.map((v, idx) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVoucher(v)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${v.is_cancelled ? 'opacity-60 line-through' : ''}`}
                >
                  <td className="py-2.5 px-3 text-gray-900 whitespace-nowrap">{formatDate(v.date)}</td>
                  <td className="py-2.5 px-3 text-gray-900 font-mono text-xs">{v.voucher_number || '-'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      {v.voucher_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-900 max-w-[180px] truncate">{v.party_ledger || '-'}</td>
                  <td className="py-2.5 px-3 text-right text-gray-900 font-medium whitespace-nowrap">
                    {formatCurrency(v.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 max-w-[200px]" title={v.narration || ''}>
                    {truncate(v.narration)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={v.sync_status} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <DirectionBadge direction={v.sync_direction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="px-3 py-1 text-xs text-gray-700 font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedVoucher && (
        <DetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </div>
  )
}
