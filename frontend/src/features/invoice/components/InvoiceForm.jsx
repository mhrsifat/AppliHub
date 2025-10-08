import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoices from '../hooks/useInvoices';

function blankItem() { return { service_name: '', unit_price: 0, quantity: 1 }; }

export default function InvoiceForm({ initial = null }) {
  const navigate = useNavigate();
  const { create } = useInvoices();
  const [form, setForm] = useState({
    order_id: initial?.order_id ?? null,
    vat_percent: initial?.vat_percent ?? 0,
    coupon_discount: initial?.coupon_discount ?? 0,
    items: initial?.items?.map(it => ({ service_name: it.service_name || '', unit_price: Number(it.unit_price || 0), quantity: Number(it.quantity || 1) })) ?? [blankItem()],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateItem = (idx, k, v) => setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], [k]: k === 'service_name' ? v : Number(v) }; return { ...f, items }; });
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, blankItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id) return setError('order_id required');
    setSaving(true);
    try {
      await create(form);
      navigate('/admin/invoices');
    } catch (err) { setError(err?.message || 'Save failed'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className='bg-white shadow p-4 rounded'>
      {error && <div className='text-red-600 mb-2'>{error}</div>}
      <div className='grid grid-cols-2 gap-3'>
        <div><label className='block text-sm'>Order ID</label><input value={form.order_id || ''} onChange={(e) => updateField('order_id', e.target.value)} className='border p-2 rounded w-full' /></div>
        <div><label className='block text-sm'>VAT %</label><input type='number' value={form.vat_percent} onChange={(e) => updateField('vat_percent', Number(e.target.value))} className='border p-2 rounded w-full' /></div>
        <div><label className='block text-sm'>Coupon discount</label><input type='number' value={form.coupon_discount} onChange={(e) => updateField('coupon_discount', Number(e.target.value))} className='border p-2 rounded w-full' /></div>
      </div>
      <div className='mt-4'>
        <h3 className='font-medium mb-2'>Items</h3>
        {form.items.map((it, idx) => (
          <div key={idx} className='flex gap-2 items-end mb-2'>
            <input value={it.service_name} onChange={(e) => updateItem(idx, 'service_name', e.target.value)} placeholder='Service name' className='border p-2 rounded flex-1' />
            <input type='number' value={it.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} placeholder='Unit' className='border p-2 rounded w-24' />
            <input type='number' value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder='Qty' className='border p-2 rounded w-20' />
            <button type='button' onClick={() => removeItem(idx)} className='text-red-600'>X</button>
          </div>
        ))}
        <button type='button' onClick={addItem} className='px-3 py-1 border rounded'>Add item</button>
      </div>
      <div className='mt-4 flex gap-2'>
        <button type='submit' disabled={saving} className='bg-green-600 text-white px-4 py-2 rounded'>{saving ? 'Saving...' : 'Save Invoice'}</button>
        <button type='button' onClick={() => navigate('/admin/invoices')} className='px-4 py-2 border rounded'>Cancel</button>
      </div>
    </form>
  );
}
