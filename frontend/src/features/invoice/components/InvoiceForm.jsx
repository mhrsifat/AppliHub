import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoices from '../hooks/useInvoices';

function newItem() {
  return { _key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, service_name: '', unit_price: 0, quantity: 1 };
}

function formatCurrency(v) {
  return Number(v || 0).toFixed(2);
}

export default function InvoiceForm({ initial = null }) {
  const navigate = useNavigate();
  const { create } = useInvoices();

  const [form, setForm] = useState({
    order_id: initial?.order_id ?? '',
    vat_percent: Number(initial?.vat_percent ?? 0),
    coupon_discount: Number(initial?.coupon_discount ?? 0),
    items: (initial?.items?.map(it => ({ ...newItem(), service_name: it.service_name || '', unit_price: Number(it.unit_price || 0), quantity: Number(it.quantity || 1) })) ) ?? [newItem()],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // { items: { key: { service_name: '...', ... } }, order_id: '...' }

  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateItem = (key, k, rawVal) => {
    setForm(f => {
      const items = f.items.map(it => {
        if (it._key !== key) return it;
        const val = k === 'service_name' ? rawVal : (rawVal === '' ? '' : (k === 'quantity' ? parseInt(rawVal, 10) : parseFloat(rawVal)));
        return { ...it, [k]: val };
      });
      return { ...f, items };
    });
    // clear per-item error for field
    setFieldErrors(prev => {
      if (!prev.items) return prev;
      const copy = { ...prev };
      copy.items = { ...copy.items };
      if (copy.items[key]) {
        const { [k]: removed, ...rest } = copy.items[key];
        if (Object.keys(rest).length === 0) {
          delete copy.items[key];
        } else {
          copy.items[key] = rest;
        }
      }
      return copy;
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, newItem()] }));
  const removeItem = (key) => setForm(f => ({ ...f, items: f.items.filter(it => it._key !== key) }));

  const computeTotals = useMemo(() => {
    const subtotal = form.items.reduce((s, it) => s + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0);
    const vat_amount = ((Number(form.vat_percent || 0) / 100) * subtotal);
    const grand = subtotal + vat_amount - Number(form.coupon_discount || 0);
    return { subtotal, vat_amount, grand_total: grand };
  }, [form.items, form.vat_percent, form.coupon_discount]);

  const validate = () => {
    const errors = {};
    if (!form.order_id) errors.order_id = 'Order ID is required';
    if (!Array.isArray(form.items) || form.items.length === 0) errors.items = 'At least one item required';

    const itemErrs = {};
    form.items.forEach((it) => {
      const e = {};
      if (!String(it.service_name || '').trim()) e.service_name = 'Service name required';
      if (it.unit_price === '' || isNaN(Number(it.unit_price)) || Number(it.unit_price) < 0) e.unit_price = 'Unit price must be >= 0';
      if (it.quantity === '' || isNaN(Number(it.quantity)) || Number(it.quantity) < 1) e.quantity = 'Quantity must be >= 1';
      if (Object.keys(e).length) itemErrs[it._key] = e;
    });

    if (Object.keys(itemErrs).length) errors.itemErrors = itemErrs;
    setFieldErrors(prev => ({ ...prev, ...(errors.itemErrors ? { items: errors.itemErrors } : {}), order_id: errors.order_id }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const payload = {
      order_id: form.order_id || null,
      vat_percent: Number(form.vat_percent || 0),
      coupon_discount: Number(form.coupon_discount || 0),
      items: form.items.map(it => ({
        service_name: String(it.service_name).trim(),
        unit_price: Number(it.unit_price || 0),
        quantity: Number(it.quantity || 1),
      })),
    };

    setSaving(true);
    try {
      // dispatch thunk and unwrap the result to get real success or throw server validation
      await create(payload).unwrap();
      navigate('/admin/invoices');
    } catch (err) {
      // err might be string, Error, or object with message/errors
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded">
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Order ID</label>
          <input
            value={form.order_id}
            onChange={(e) => updateField('order_id', e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Existing order id"
          />
          {fieldErrors?.order_id && <div className="text-xs text-red-600 mt-1">{fieldErrors.order_id}</div>}
        </div>

        <div>
          <label className="block text-sm">VAT %</label>
          <input
            type="number"
            value={form.vat_percent}
            onChange={(e) => updateField('vat_percent', e.target.value === '' ? '' : Number(e.target.value))}
            className="border p-2 rounded w-full"
            min={0}
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm">Coupon discount</label>
          <input
            type="number"
            value={form.coupon_discount}
            onChange={(e) => updateField('coupon_discount', e.target.value === '' ? '' : Number(e.target.value))}
            className="border p-2 rounded w-full"
            min={0}
            step="0.01"
          />
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Subtotal: {formatCurrency(computeTotals.subtotal)}</div>
          <div className="text-sm text-gray-600">VAT: {formatCurrency(computeTotals.vat_amount)}</div>
          <div className="text-lg font-semibold">Grand Total: {formatCurrency(computeTotals.grand_total)}</div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Items</h3>

        {form.items.map((it, idx) => {
          const errs = fieldErrors?.items?.[it._key] ?? {};
          return (
            <div key={it._key} className="flex gap-2 items-end mb-2">
              <div className="flex-1">
                <input
                  value={it.service_name}
                  onChange={(e) => updateItem(it._key, 'service_name', e.target.value)}
                  placeholder="Service name"
                  className="border p-2 rounded w-full"
                />
                {errs?.service_name && <div className="text-xs text-red-600 mt-1">{errs.service_name}</div>}
              </div>

              <div>
                <input
                  type="number"
                  value={it.unit_price}
                  onChange={(e) => updateItem(it._key, 'unit_price', e.target.value)}
                  placeholder="Unit"
                  className="border p-2 rounded w-28"
                  min={0}
                  step="0.01"
                />
                {errs?.unit_price && <div className="text-xs text-red-600 mt-1">{errs.unit_price}</div>}
              </div>

              <div>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => updateItem(it._key, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="border p-2 rounded w-20"
                  min={1}
                  step="1"
                />
                {errs?.quantity && <div className="text-xs text-red-600 mt-1">{errs.quantity}</div>}
              </div>

              <div className="w-24 text-right">
                <div className="text-sm">Line: {formatCurrency(Number(it.unit_price || 0) * Number(it.quantity || 0))}</div>
              </div>

              <button type="button" onClick={() => removeItem(it._key)} className="text-red-600">X</button>
            </div>
          );
        })}

        <div>
          <button type="button" onClick={addItem} className="px-3 py-1 border rounded">Add item</button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
          {saving ? 'Saving...' : 'Save Invoice'}
        </button>
        <button type="button" onClick={() => navigate('/admin/invoices')} className="px-4 py-2 border rounded">Cancel</button>
      </div>
    </form>
  );
}