import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import useInvoices from "../hooks/useInvoices";
import {
  addInvoiceItem as addInvoiceItemThunk,
  updateInvoiceItem as updateInvoiceItemThunk,
  removeInvoiceItem as removeInvoiceItemThunk,
  recordPayment as recordPaymentThunk,
  fetchInvoice as fetchInvoiceThunk,
} from "../slices/invoiceSlice";

function blankItem() {
  return { service_name: "", unit_price: 0, quantity: 1 };
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: invoice, getOne } = useInvoices();
  const [newItem, setNewItem] = useState(blankItem());
  const [adding, setAdding] = useState(false);
  const [payment, setPayment] = useState({ amount: 0, method: "cash", payment_reference: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) getOne(id);
    // eslint-disable-next-line
  }, [id]);

  const refresh = async () => {
    try {
      await dispatch(fetchInvoiceThunk(id)).unwrap();
    } catch (err) {}
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newItem.service_name) return setError("Service name required");
    setAdding(true);
    try {
      await dispatch(addInvoiceItemThunk({ invoiceId: id, item: newItem })).unwrap();
      setNewItem(blankItem());
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (it) => {
    setEditItemId(it.id);
    setEditItem({ service_name: it.service_name, unit_price: Number(it.unit_price), quantity: Number(it.quantity) });
  };
  const cancelEdit = () => { setEditItemId(null); setEditItem(null); };
  const saveEdit = async (itemId) => {
    setBusy(true);
    try {
      await dispatch(updateInvoiceItemThunk({ invoiceId: id, itemId, item: editItem })).unwrap();
      await refresh();
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Failed to update item");
    } finally { setBusy(false); }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Remove this item?")) return;
    setBusy(true);
    try {
      await dispatch(removeInvoiceItemThunk({ invoiceId: id, itemId })).unwrap();
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to remove item");
    } finally { setBusy(false); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (!payment.amount || Number(payment.amount) <= 0) {
      setError("Amount required");
      setBusy(false);
      return;
    }
    try {
      await dispatch(recordPaymentThunk({ invoiceId: id, payment })).unwrap();
      setPayment({ amount: 0, method: "cash", payment_reference: "", note: "" });
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  if (!invoice) {
    return <div className="p-4">Loading invoice...</div>;
  }

  const subtotal = Number(invoice.subtotal ?? 0);
  const vat = Number(invoice.vat_amount ?? 0);
  const coupon = Number(invoice.coupon_discount ?? 0);
  const grand = Number(invoice.grand_total ?? subtotal + vat - coupon);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Invoice #{invoice.invoice_number}</h1>
          <div className="text-sm text-gray-600">Order: {invoice.order_id}</div>
          <div className="text-sm text-gray-600">Status: <span className="font-medium">{invoice.status}</span></div>
        </div>
        <div className="text-right">
          <div className="mb-2">Paid: {Number(invoice.paid_amount ?? 0).toFixed(2)}</div>
          <div className="mb-2">Balance: {(grand - Number(invoice.paid_amount ?? 0)).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4 mb-4">
        <h3 className="font-medium mb-2">Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Unit</th>
                <th className="px-4 py-2 text-right">Line total</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">
                    {editItemId === it.id ? (
                      <input value={editItem.service_name} onChange={(e) => setEditItem({ ...editItem, service_name: e.target.value })} className="border p-1 rounded w-full" />
                    ) : (
                      it.service_name
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editItemId === it.id ? (
                      <input type="number" value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value || 0) })} className="border p-1 rounded w-20 text-right" />
                    ) : (
                      it.quantity
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editItemId === it.id ? (
                      <input type="number" value={editItem.unit_price} onChange={(e) => setEditItem({ ...editItem, unit_price: Number(e.target.value || 0) })} className="border p-1 rounded w-28 text-right" />
                    ) : (
                      Number(it.unit_price).toFixed(2)
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{Number(it.line_total ?? (it.unit_price * it.quantity)).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    {editItemId === it.id ? (
                      <>
                        <button onClick={() => saveEdit(it.id)} className="text-green-600 mr-2">Save</button>
                        <button onClick={cancelEdit} className="text-gray-600">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(it)} className="text-blue-600 mr-2">Edit</button>
                        <button onClick={() => handleRemoveItem(it.id)} className="text-red-600">Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-4">
          <form onSubmit={handleAddItem} className="grid grid-cols-4 gap-2 items-end">
            {error && <div className="col-span-4 text-red-600">{error}</div>}
            <div>
              <label className="block text-sm">Service</label>
              <input value={newItem.service_name} onChange={(e) => setNewItem({ ...newItem, service_name: e.target.value })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm">Unit price</label>
              <input type="number" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value || 0) })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm">Qty</label>
              <input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value || 1) })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <button type="submit" disabled={adding} className="bg-green-600 text-white px-3 py-2 rounded w-full">{adding ? "Adding..." : "Add Item"}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-medium mb-2">Totals</h3>
          <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>VAT</span><span>{vat.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Coupon</span><span>-{coupon.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-lg mt-2"><span>Grand Total</span><span>{grand.toFixed(2)}</span></div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-medium mb-2">Record Payment</h3>
          <form onSubmit={handleRecordPayment} className="space-y-2">
            {error && <div className="text-red-600">{error}</div>}
            <div>
              <label className="block text-sm">Amount</label>
              <input type="number" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value || 0) })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm">Method</label>
              <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })} className="border p-2 rounded w-full">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Reference</label>
              <input value={payment.payment_reference} onChange={(e) => setPayment({ ...payment, payment_reference: e.target.value })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm">Note</label>
              <input value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} className="border p-2 rounded w-full" />
            </div>
            <div>
              <button type="submit" disabled={busy} className="bg-blue-600 text-white px-3 py-2 rounded w-full">{busy ? "Processing..." : "Record Payment"}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Payments</h3>
        <div className="bg-white shadow rounded p-4">
          {(invoice.payments || []).length === 0 ? (
            <div className="text-gray-600">No payments yet</div>
          ) : (
            <table className="min-w-full table-auto">
              <thead><tr className="bg-gray-50"><th className="px-4 py-2">Ref</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Status</th></tr></thead>
              <tbody>
                {(invoice.payments || []).map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{p.payment_reference}</td>
                    <td className="px-4 py-2 text-right">{Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-2">{p.method}</td>
                    <td className="px-4 py-2">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}