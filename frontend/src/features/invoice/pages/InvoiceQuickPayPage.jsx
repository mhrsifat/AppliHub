import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useInvoices from "../hooks/useInvoices";
import { recordPayment } from "../slices/invoiceSlice";
import { useDispatch } from "react-redux";

export default function InvoiceQuickPayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: invoice, getOne, refresh } = useInvoices();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) getOne(id);
  }, [id, getOne]);

  const handlePay = async () => {
    if (!invoice) return;
    const numeric = Number(amount || 0);
    if (numeric <= 0) return setError("Amount must be greater than 0");

    setBusy(true);
    setError(null);
    try {
      await dispatch(
        recordPayment({
          invoiceId: invoice.id,
          payment: { amount: numeric, method },
        })
      ).unwrap();
      await refresh();
      // close modal (navigate back to invoice detail)
      navigate(`/admin/invoices/${invoice.id}`);
    } catch (err) {
      setError(err?.message || JSON.stringify(err));
    } finally {
      setBusy(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">
          Quick Pay - {invoice.invoice_number}
        </h2>
        <div className="text-sm text-gray-600 mb-4">
          Balance:{" "}
          {Number(invoice.balance ?? invoice.grand_total ?? 0).toFixed(2)}
        </div>

        <label className="block mb-2">
          <span className="text-sm">Amount</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded w-full p-2 mt-1"
            min={0}
            step="0.01"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Method</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border rounded w-full p-2 mt-1"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank">Bank</option>
          </select>
        </label>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={busy}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            {busy ? "Processing..." : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
