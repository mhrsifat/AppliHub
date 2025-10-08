import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useOrders from "../hooks/useOrders";
import {
  addOrderItem as addOrderItemThunk,
  updateOrderItem as updateOrderItemThunk,
  deleteOrderItem as deleteOrderItemThunk,
  createInvoiceFromOrder as createInvoiceFromOrderThunk,
  fetchOrder as fetchOrderThunk,
} from "../slices/orderSlice";

function blankItem() {
  return { service_name: "", unit_price: 0, quantity: 1 };
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: order, getOne, load } = useOrders();
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(blankItem());
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getOne(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // refresh helper
  const refresh = async () => {
    try {
      await dispatch(fetchOrderThunk(id)).unwrap();
    } catch (err) {
      // silent
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newItem.service_name) return setError("Service name required");
    setAdding(true);
    try {
      await dispatch(addOrderItemThunk({ orderId: id, item: newItem })).unwrap();
      setNewItem(blankItem());
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditingItem({ unit_price: Number(item.unit_price || 0), quantity: Number(item.quantity || 1), service_name: item.service_name });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingItem(null);
  };

  const saveEdit = async (itemId) => {
    setLoadingLocal(true);
    try {
      await dispatch(updateOrderItemThunk({ orderId: id, itemId, item: editingItem })).unwrap();
      await refresh();
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Failed to update item");
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    setLoadingLocal(true);
    try {
      await dispatch(deleteOrderItemThunk({ orderId: id, itemId })).unwrap();
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete item");
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleCreateInvoice = async () => {
    setLoadingLocal(true);
    try {
      const res = await dispatch(createInvoiceFromOrderThunk(id)).unwrap();
      // backend may return InvoiceResource inside response; try to get invoice id
      const invoice = res.invoice ?? res;
      const invoiceId = invoice?.id ?? (invoice?.data?.id ?? null);
      if (invoiceId) {
        navigate(`/invoices/${invoiceId}`);
      } else {
        // fallback: just refresh
        await refresh();
        alert("Invoice created");
      }
    } catch (err) {
      setError(err?.message || "Failed to create invoice");
    } finally {
      setLoadingLocal(false);
    }
  };

  if (!order) {
    return <div className="p-4">Loading order...</div>;
  }

  const subtotal = Number(order.total ?? 0);
  const vat = Number(order.vat_amount ?? 0);
  const coupon = Number(order.coupon_discount ?? 0);
  const grand = Number(order.grand_total ?? subtotal + vat - coupon);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.order_number}</h1>
          <div className="text-sm text-gray-600">Customer: {order.customer_name ?? order.guest_name}</div>
          <div className="text-sm text-gray-600">Email: {order.customer_email ?? order.guest_email}</div>
          <div className="text-sm text-gray-600">Phone: {order.customer_phone ?? order.guest_phone}</div>
        </div>
        <div className="text-right">
          <div className="mb-2">Status: <span className="font-medium">{order.status}</span></div>
          <div className="mb-2">Payment: <span className="font-medium">{order.payment_status}</span></div>
          <button onClick={handleCreateInvoice} disabled={loadingLocal} className="bg-blue-600 text-white px-3 py-1 rounded">
            {loadingLocal ? "Processing..." : "Create Invoice"}
          </button>
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
              {(order.items || []).map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">
                    {editingItemId === it.id ? (
                      <input value={editingItem.service_name} onChange={(e) => setEditingItem({ ...editingItem, service_name: e.target.value })} className="border p-1 rounded w-full" />
                    ) : (
                      it.service_name
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingItemId === it.id ? (
                      <input type="number" value={editingItem.quantity} onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value || 0) })} className="border p-1 rounded w-20 text-right" />
                    ) : (
                      it.quantity
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingItemId === it.id ? (
                      <input type="number" value={editingItem.unit_price} onChange={(e) => setEditingItem({ ...editingItem, unit_price: Number(e.target.value || 0) })} className="border p-1 rounded w-28 text-right" />
                    ) : (
                      Number(it.unit_price).toFixed(2)
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{Number(it.total_price ?? (it.unit_price * it.quantity)).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    {editingItemId === it.id ? (
                      <>
                        <button onClick={() => saveEdit(it.id)} className="text-green-600 mr-2">Save</button>
                        <button onClick={cancelEdit} className="text-gray-600">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(it)} className="text-blue-600 mr-2">Edit</button>
                        <button onClick={() => handleDeleteItem(it.id)} className="text-red-600">Delete</button>
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
              <button type="submit" disabled={adding} className="bg-green-600 text-white px-3 py-2 rounded w-full">
                {adding ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4 w-1/3">
        <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>VAT</span><span>{vat.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Coupon</span><span>-{coupon.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold text-lg mt-2"><span>Grand Total</span><span>{grand.toFixed(2)}</span></div>
      </div>
    </div>
  );
}