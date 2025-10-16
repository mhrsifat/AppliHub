// src/features/invoice/components/InvoiceList.jsx
/**
 * InvoiceList using dynamic routing (admin/employee)
 * - All navigation uses React Router Link
 * - Status filter, per-page selector, pagination
 * - Quick Pay, View, Edit buttons
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useInvoices from "../hooks/useInvoices";
import Loader from "@/components/common/Loader";
import { useSelector } from "react-redux";

export default function InvoiceList() {
  const { admin, employee } = useSelector((state) => state.auth);
  const basePath = admin ? "/admin/" : employee ? "/employee/" : "/";

  const {
    list = [],
    meta,
    loading,
    error,
    page,
    setPage,
    perPage,
    setPerPage,
    load,
    refresh,
  } = useInvoices({ initialPage: 1, perPage: 10 });

  const isLoading = loading?.list ?? loading;
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    load();
  }, []); // initial load

  const filtered = (list || []).filter((i) =>
    filterStatus === "all" ? true : i.status === filterStatus
  );

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border px-2 py-2 rounded"
          >
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>

          <select
            value={perPage}
            onChange={handlePerPageChange}
            className="border px-2 py-2 rounded"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <Link
            to={`${basePath}invoices/create`}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            New Invoice
          </Link>
          <button
            onClick={() => refresh()}
            className="px-3 py-2 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white shadow rounded p-6">
          <Loader />
        </div>
      ) : (
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-3 text-left">Invoice#</th>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t text-sm">
                  <td className="px-4 py-2">{i.invoice_number}</td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      {i.order_id ? `#${i.order_id}` : "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {i.customer_name ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {Number(i.grand_total ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        i.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : i.status === "partially_paid"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {i.status ?? "unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`${basePath}invoices/${i.id}`}
                        className="text-blue-600"
                      >
                        View
                      </Link>
                      <Link
                        to={`${basePath}invoices/${i.id}/edit`}
                        className="text-green-600"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`${basePath}invoices/${i.id}/quick-pay`}
                        className="text-indigo-600"
                      >
                        Quick Pay
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-3 flex justify-between items-center">
            <div>Page {meta?.current_page ?? page}</div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 border rounded"
                disabled={!(meta?.current_page > 1)}
                onClick={() => setPage((p) => Math.max(1, (p || 1) - 1))}
              >
                Prev
              </button>
              <button
                className="px-2 py-1 border rounded"
                disabled={
                  !(
                    meta &&
                    meta.current_page * (meta.per_page || perPage) <
                      (meta.total || 0)
                  )
                }
                onClick={() => setPage((p) => (p || 1) + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-red-600 text-sm">Error: {String(error)}</div>
      )}
    </div>
  );
}
