import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useOrders from "../hooks/useOrders";
import {
  addOrderItem as addOrderItemThunk,
  updateOrderItem as updateOrderItemThunk,
  deleteOrderItem as deleteOrderItemThunk,
  createInvoiceFromOrder as createInvoiceFromOrderThunk,
} from "../slices/orderSlice";

function blankItem() {
  return { service_name: "", unit_price: 0, quantity: 1 };
}

function formatCurrency(v) {
  return Number(v || 0).toFixed(2);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: order, getOne } = useOrders();
  // Normalize API responses that may be wrapped as { data: {...} }
  const ord = order?.data ?? order;
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(blankItem());
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (id) {
      // getOne returns the dispatched promise — we don't need to unwrap here,
      // it's used for initial load and the hook manages loading state.
      getOne(id);
    }
  }, [id, getOne]);

  const refresh = async () => {
    try {
      // use the hook's getOne so behaviour is centralized
      await getOne(id).unwrap();
    } catch (err) {
      // keep silent but record for debugging
      console.error("refresh order failed", err);
    }
  };

  const handleAddItem = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!String(newItem.service_name || "").trim())
      return setError("Service name required");
    if (Number(newItem.unit_price) < 0)
      return setError("Unit price must be >= 0");
    if (Number(newItem.quantity) < 1) return setError("Quantity must be >= 1");

    setAdding(true);
    try {
      await dispatch(
        addOrderItemThunk({
          orderId: id,
          item: {
            service_name: String(newItem.service_name).trim(),
            unit_price: Number(newItem.unit_price || 0),
            quantity: Number(newItem.quantity || 1),
          },
        })
      ).unwrap();

      setNewItem(blankItem());
      await refresh();
    } catch (err) {
      // err can be string/object from server; normalize
      const msg = err?.message || err?.data?.message || JSON.stringify(err);
      setError(msg);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditingItem({
      service_name: item.service_name ?? "",
      unit_price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingItem(null);
    setError(null);
  };

  const saveEdit = async (itemId) => {
    if (!editingItem) return;
    if (!String(editingItem.service_name || "").trim())
      return setError("Service name required");
    if (Number(editingItem.unit_price) < 0)
      return setError("Unit price must be >= 0");
    if (Number(editingItem.quantity) < 1)
      return setError("Quantity must be >= 1");

    setBusy(true);
    try {
      await dispatch(
        updateOrderItemThunk({
          orderId: id,
          itemId,
          item: {
            service_name: String(editingItem.service_name).trim(),
            unit_price: Number(editingItem.unit_price || 0),
            quantity: Number(editingItem.quantity || 1),
          },
        })
      ).unwrap();

      await refresh();
      cancelEdit();
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    try {
      await dispatch(deleteOrderItemThunk({ orderId: id, itemId })).unwrap();
      await refresh();
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!ord?.items || ord.items.length === 0) {
      return setError("Order has no items to invoice");
    }
    setBusy(true);
    try {
      const res = await dispatch(
        createInvoiceFromOrderThunk({ orderId: id })
      ).unwrap();
      const invoice = (res && (res.invoice ?? res)) || null;
      const invoiceId = invoice?.id ?? invoice?.data?.id ?? null;
      if (invoiceId) {
        navigate(`invoices/${invoiceId}`);
      } else {
        await refresh();
        alert("Invoice created");
      }
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!ord) {
    return <div className="p-4">Loading order...</div>;
  }

  // Prepare derived collections safely
  const invoices = Array.isArray(ord.invoices) ? ord.invoices : [];
  const _paymentsFlatten = invoices.flatMap((inv) =>
    Array.isArray(inv.payments) ? inv.payments : []
  );

  // Compute totals from items to avoid stale server fields
  const subtotal = (Array.isArray(ord.items) ? ord.items : []).reduce(
    (s, it) => {
      const line = Number(
        it.total_price ??
          (it.unit_price && it.quantity ? it.unit_price * it.quantity : 0)
      );
      return s + (isNaN(line) ? 0 : line);
    },
    0
  );

  const vatPercent = Number(ord.vat_percent ?? 0);
  const vat = Math.round((vatPercent / 100) * subtotal * 100) / 100;
  const coupon = Number(ord.coupon_discount ?? 0);
  const grand = Math.round((subtotal + vat - coupon) * 100) / 100;

  const totalPaid = invoices.reduce((s, inv) => {
    const paidFromInv = Number(inv.paid_amount ?? 0);
    if (paidFromInv > 0) return s + paidFromInv;
    // fallback: sum payments on the invoice
    const paymentsSum = (
      Array.isArray(inv.payments) ? inv.payments : []
    ).reduce((ps, p) => ps + Number(p.amount || 0), 0);
    return s + paymentsSum;
  }, 0);

  // If invoices exist, compute total invoiced amount; otherwise fallback to order grand
  const totalInvoiced =
    invoices.reduce(
      (s, inv) => s + Number(inv.grand_total ?? inv.total ?? 0),
      0
    ) || grand;
  const totalDue = Math.max(0, totalInvoiced - totalPaid);

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const payload = {
        order: ord,
        invoices,
        totals: {
          subtotal,
          vat,
          coupon,
          grand,
          totalInvoiced,
          totalPaid,
          totalDue,
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${ord.order_number || ord.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("export failed", e);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Order #{ord.order_number}</h1>
          <div className="text-sm text-gray-600">
            Customer: {ord.customer_name ?? "Unknown"}
          </div>
          <div className="text-sm text-gray-600">
            Email: {ord.customer_email ?? ord.guest_email ?? "-"}
          </div>
          <div className="text-sm text-gray-600">
            Phone: {ord.customer_phone ?? ord.guest_phone ?? "-"}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-2">
            Status: <span className="font-medium">{ord.status ?? "-"}</span>
          </div>
          <div className="mb-2">
            Payment:{" "}
            <span className="font-medium">
              {ord.payment_status ?? "unpaid"}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCreateInvoice}
              disabled={busy}
              className="bg-blue-600 text-white px-3 py-1 rounded"
              title="Create invoice from this order"
            >
              {busy ? "Processing..." : "Create Invoice"}
            </button>

            <button
              onClick={handleExportJson}
              disabled={exporting}
              className="bg-green-600 text-white px-3 py-1 rounded"
              title="Export order as JSON"
            >
              {exporting ? "Exporting..." : "Export JSON"}
            </button>

            <button
              onClick={() => setShowRaw((s) => !s)}
              className="px-3 py-1 border rounded"
              title="Toggle raw payload"
            >
              {showRaw ? "Hide Raw" : "Show Raw"}
            </button>

            <button
              onClick={() => navigate(`orders/${ord.id}/edit`)}
              className="px-3 py-1 border rounded"
            >
              Edit Order
            </button>
          </div>
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
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(ord.items || []).map((it) => {
                const lineTotal = Number(
                  it.total_price != null
                    ? it.total_price
                    : it.unit_price * it.quantity || 0
                );
                return (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2 w-1/2">
                      {editingItemId === it.id ? (
                        <input
                          value={editingItem?.service_name ?? ""}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              service_name: e.target.value,
                            })
                          }
                          className="border p-1 rounded w-full"
                          aria-label="Service name"
                        />
                      ) : (
                        it.service_name
                      )}
                    </td>

                    <td className="px-4 py-2 text-right w-24">
                      {editingItemId === it.id ? (
                        <input
                          type="number"
                          value={editingItem?.quantity ?? 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              quantity: Number(e.target.value || 0),
                            })
                          }
                          className="border p-1 rounded w-full text-right"
                          min={1}
                          aria-label="Quantity"
                        />
                      ) : (
                        it.quantity
                      )}
                    </td>

                    <td className="px-4 py-2 text-right w-28">
                      {editingItemId === it.id ? (
                        <input
                          type="number"
                          value={editingItem?.unit_price ?? 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              unit_price: Number(e.target.value || 0),
                            })
                          }
                          className="border p-1 rounded w-full text-right"
                          min={0}
                          step="0.01"
                          aria-label="Unit price"
                        />
                      ) : (
                        Number(it.unit_price).toFixed(2)
                      )}
                    </td>

                    <td className="px-4 py-2 text-right">
                      {formatCurrency(lineTotal)}
                    </td>

                    <td className="px-4 py-2">
                      {editingItemId === it.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(it.id)}
                            disabled={busy}
                            className="text-green-600 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(it)}
                            className="text-blue-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-4">
          <form
            onSubmit={handleAddItem}
            className="grid grid-cols-4 gap-2 items-end"
          >
            {error && <div className="col-span-4 text-red-600">{error}</div>}

            <div>
              <label className="block text-sm">Service</label>
              <input
                value={newItem.service_name}
                onChange={(e) =>
                  setNewItem({ ...newItem, service_name: e.target.value })
                }
                className="border p-2 rounded w-full"
                placeholder="Service name"
                aria-label="New service name"
              />
            </div>

            <div>
              <label className="block text-sm">Unit price</label>
              <input
                type="number"
                value={newItem.unit_price}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    unit_price: Number(e.target.value || 0),
                  })
                }
                className="border p-2 rounded w-full"
                min={0}
                step="0.01"
                aria-label="New unit price"
              />
            </div>

            <div>
              <label className="block text-sm">Qty</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    quantity: Number(e.target.value || 1),
                  })
                }
                className="border p-2 rounded w-full"
                min={1}
                aria-label="New quantity"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={adding}
                className="bg-green-600 text-white px-3 py-2 rounded w-full"
              >
                {adding ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Invoices summary and list */}
      <div className="bg-white shadow rounded p-4 mb-4">
        <h3 className="font-medium mb-2">Invoices</h3>

        <div className="grid grid-cols-4 gap-4 text-sm mb-4">
          <div className="p-2 border rounded">
            <div className="text-gray-500">Total Invoices</div>
            <div className="font-semibold">{invoices.length}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-gray-500">Total Invoiced</div>
            <div className="font-semibold">{formatCurrency(totalInvoiced)}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-gray-500">Total Paid</div>
            <div className="font-semibold">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-gray-500">Total Due</div>
            <div className="font-semibold">{formatCurrency(totalDue)}</div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-sm text-gray-600">
            No invoices for this order yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Grand</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-right">Due</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const invGrand = Number(inv.grand_total ?? inv.total ?? 0);
                  const invPaid = Number(
                    inv.paid_amount ??
                      (Array.isArray(inv.payments)
                        ? inv.payments.reduce(
                            (s, p) => s + Number(p.amount || 0),
                            0
                          )
                        : 0)
                  );
                  const invDue = Math.max(0, invGrand - invPaid);
                  const date = inv.created_at
                    ? new Date(inv.created_at).toLocaleString()
                    : "-";
                  return (
                    <tr key={inv.id} className="border-t">
                      <td className="px-3 py-2">
                        {inv.invoice_number ?? `#${inv.id}`}
                      </td>
                      <td className="px-3 py-2">{date}</td>
                      <td className="px-3 py-2">{inv.status ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(invGrand)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(invPaid)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(invDue)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`invoices/${inv.id}`)
                            }
                            className="text-blue-600"
                          >
                            View
                          </button>
                          {inv.pdf_url ? (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600"
                            >
                              PDF
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRaw && (
        <div className="bg-gray-50 p-3 rounded mb-4">
          <div className="text-sm text-gray-700 font-medium mb-2">
            Raw payloads (redux `order` and normalized `ord`)
          </div>
          <pre className="text-xs max-h-64 overflow-auto bg-white p-2 border rounded">
            {JSON.stringify({ order, ord }, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-white shadow rounded p-4 w-1/3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT</span>
          <span>{formatCurrency(vat)}</span>
        </div>
        <div className="flex justify-between">
          <span>Coupon</span>
          <span>-{formatCurrency(coupon)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg mt-2">
          <span>Grand Total</span>
          <span>{formatCurrency(grand)}</span>
        </div>
      </div>
    </div>
  );
}
