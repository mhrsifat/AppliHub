import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useInvoices from "../hooks/useInvoices";

export default function InvoiceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    current: invoice,
    getOne,
    save,
    refresh,
    loading,
    error,
  } = useInvoices();

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) getOne(id);
  }, [id, getOne]);

  useEffect(() => {
    if (invoice) {
      setForm({
        customer_name: invoice.customer_name ?? "",
        customer_email: invoice.customer_email ?? "",
        customer_phone: invoice.customer_phone ?? "",
        notes: invoice.notes ?? "",
      });
    }
  }, [invoice]);

  const handleSave = useCallback(async () => {
    if (!invoice) return;
    setBusy(true);
    try {
      await save(invoice.id, form).unwrap();
      await refresh();
      navigate(`/admin/invoices/${invoice.id}`);
    } catch (err) {
      console.error("save invoice failed", err);
    } finally {
      setBusy(false);
    }
  }, [invoice, form, save, refresh, navigate]);

  if (!invoice) return <div className="p-4">Loading invoice...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Edit Invoice #{invoice.invoice_number}
      </h1>

      <div className="bg-white shadow rounded p-4 max-w-2xl">
        <label className="block mb-2">
          <span className="text-sm">Customer name</span>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.customer_name}
            onChange={(e) =>
              setForm({ ...form, customer_name: e.target.value })
            }
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm">Customer email</span>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.customer_email}
            onChange={(e) =>
              setForm({ ...form, customer_email: e.target.value })
            }
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm">Customer phone</span>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.customer_phone}
            onChange={(e) =>
              setForm({ ...form, customer_phone: e.target.value })
            }
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Notes</span>
          <textarea
            className="border rounded w-full p-2 mt-1"
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {busy ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>

        {error && <div className="mt-3 text-red-600">{String(error)}</div>}
      </div>
    </div>
  );
}
