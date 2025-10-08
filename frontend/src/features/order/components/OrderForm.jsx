import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';

function blankItem() { return { service_name: '', unit_price: 0, quantity: 1 }; }

export default function OrderForm() {
  const navigate = useNavigate();
  const { create } = useOrders();
  const [form, setForm] = useState({ guest_name: '', guest_email: '', guest_phone: '', guest_address: '', vat_percent: 0, coupon_discount: 0, items: [blankItem()] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updateItem = (idx, key, value) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], [key]: key === 'service_name' ? value : Number(value) }; return { ...f, items }; });
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name) return setError('Customer name required');
    setSaving(true);
    try {
      const payload = { ...form, items: form.items.map((it) => ({ service_name: it.service_name, unit_price: it.unit_price, quantity: it.quantity })) };
      await create(payload);
      navigate('/admin/orders');
    } catch (err) { setError(err?.message || 'Save failed'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className='bg-white shadow p-4 rounded'>
      {error && <div className='text-red-600 mb-2'>{error}</div>}
      <div className='grid grid-cols-2 gap-3'>
        {['guest_name', 'guest_email', 'guest_phone', 'guest_address'].map((k) => (
          <div key={k}><label className='block text-sm capitalize'>{k.replace('_', ' ')}</label>
            <input value={form[k]} onChange={(e) => updateField(k, e.target.value)} className='border p-2 rounded w-full' />
          </div>
        ))}
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
        <button type='submit' disabled={saving} className='bg-green-600 text-white px-4 py-2 rounded'>{saving ? 'Saving...' : 'Save Order'}</button>
        <button type='button' onClick={() => navigate('/admin/orders')} className='px-4 py-2 border rounded'>Cancel</button>
      </div>
    </form>
  );
}
