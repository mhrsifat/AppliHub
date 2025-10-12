// src/features/order/components/OrderForm.jsx
/**
 * src/features/order/components/OrderForm.jsx
 *
 * Minimal, feature-rich order form using MUI + heroicons.
 * - Clean grid layout, inline item add/remove, validation messages.
 * - Uses useOrders() create() method for submission.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';

function newItem() {
  return { _key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, service_name: '', unit_price: 0, quantity: 1 };
}

function currency(v) {
  return Number(v || 0).toFixed(2);
}

export default function OrderForm({ initial = null }) {
  const navigate = useNavigate();
  const { create } = useOrders();

  const [form, setForm] = useState({
    customer_name: initial?.customer_name ?? '',
    customer_email: initial?.customer_email ?? '',
    customer_phone: initial?.customer_phone ?? '',
    customer_address: initial?.customer_address ?? '',
    vat_percent: Number(initial?.vat_percent ?? 0),
    coupon_discount: Number(initial?.coupon_discount ?? 0),
    items: (initial?.items?.map(it => ({ ...newItem(), service_name: it.service_name || '', unit_price: Number(it.unit_price || 0), quantity: Number(it.quantity || 1) })) ) ?? [newItem()],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((s, it) => s + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0);
    const vat_amount = (Number(form.vat_percent || 0) / 100) * subtotal;
    const grand_total = subtotal + vat_amount - Number(form.coupon_discount || 0);
    return { subtotal, vat_amount, grand_total };
  }, [form.items, form.vat_percent, form.coupon_discount]);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updateItem = (key, k, rawVal) => {
    setForm((f) => {
      const items = f.items.map(it => it._key === key ? { ...it, [k]: k === 'service_name' ? rawVal : (rawVal === '' ? '' : (k === 'quantity' ? parseInt(rawVal, 10) : parseFloat(rawVal))) } : it);
      return { ...f, items };
    });
    setFieldErrors(prev => {
      const copy = { ...prev };
      if (copy.items && copy.items[key]) {
        const { [k]: removed, ...rest } = copy.items[key];
        if (Object.keys(rest).length === 0) {
          const c = { ...copy.items }; delete c[key]; copy.items = c;
        } else copy.items[key] = rest;
      }
      return copy;
    });
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, newItem()] }));
  const removeItem = (key) => setForm((f) => ({ ...f, items: f.items.filter(it => it._key !== key) }));

  const validate = () => {
    const errors = {};
    if (!form.customer_name || !String(form.customer_name).trim()) errors.customer_name = 'Customer name is required';
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
    setFieldErrors(prev => ({ ...prev, ...(errors.itemErrors ? { items: errors.itemErrors } : {}), customer_name: errors.customer_name }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    const payload = {
      customer_name: String(form.customer_name).trim(),
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      customer_address: form.customer_address || null,
      vat_percent: Number(form.vat_percent || 0),
      coupon_discount: Number(form.coupon_discount || 0),
      items: form.items.map(it => ({ service_name: String(it.service_name).trim(), unit_price: Number(it.unit_price || 0), quantity: Number(it.quantity || 1) })),
    };

    setSaving(true);
    try {
      await create(payload).unwrap();
      navigate('/admin/orders');
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Typography variant="h6">Order</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer name"
                value={form.customer_name}
                onChange={(e) => updateField('customer_name', e.target.value)}
                error={Boolean(fieldErrors?.customer_name)}
                helperText={fieldErrors?.customer_name}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Customer email" value={form.customer_email} onChange={(e) => updateField('customer_email', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Customer phone" value={form.customer_phone} onChange={(e) => updateField('customer_phone', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Customer address" value={form.customer_address} onChange={(e) => updateField('customer_address', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField fullWidth type="number" label="VAT %" value={form.vat_percent} onChange={(e) => updateField('vat_percent', e.target.value === '' ? '' : Number(e.target.value))} size="small" />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField fullWidth type="number" label="Coupon discount" value={form.coupon_discount} onChange={(e) => updateField('coupon_discount', e.target.value === '' ? '' : Number(e.target.value))} size="small" />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Items</Typography>

            {form.items.map((it) => {
              const errs = fieldErrors?.items?.[it._key] ?? {};
              return (
                <Grid key={it._key} container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={6} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      value={it.service_name}
                      onChange={(e) => updateItem(it._key, 'service_name', e.target.value)}
                      placeholder="Service name"
                      error={Boolean(errs?.service_name)}
                      helperText={errs?.service_name}
                    />
                  </Grid>

                  <Grid item xs={3} md={2}>
                    <TextField fullWidth size="small" type="number" value={it.unit_price} onChange={(e) => updateItem(it._key, 'unit_price', e.target.value)} placeholder="Unit" />
                  </Grid>

                  <Grid item xs={2} md={2}>
                    <TextField fullWidth size="small" type="number" value={it.quantity} onChange={(e) => updateItem(it._key, 'quantity', e.target.value)} placeholder="Qty" />
                  </Grid>

                  <Grid item xs={1} md={1}>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>{currency(Number(it.unit_price || 0) * Number(it.quantity || 0))}</Typography>
                  </Grid>

                  <Grid item xs={12} md={1}>
                    <IconButton size="small" onClick={() => removeItem(it._key)} aria-label="remove">
                      <TrashIcon style={{ width: 16, height: 16 }} />
                    </IconButton>
                  </Grid>
                </Grid>
              );
            })}

            <Button onClick={addItem} startIcon={<PlusIcon style={{ width: 16, height: 16 }} />} size="small" variant="outlined">Add item</Button>
            {fieldErrors?.items && <Typography color="error" variant="caption" display="block" mt={1}>Please fix item errors</Typography>}
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={4} alignItems="center" mt={2}>
            <Box textAlign="right">
              <Typography variant="body2">Subtotal: {currency(totals.subtotal)}</Typography>
              <Typography variant="body2">VAT: {currency(totals.vat_amount)}</Typography>
              <Typography variant="h6">Grand: {currency(totals.grand_total)}</Typography>
            </Box>

            <Box>
              <Stack direction="row" spacing={1}>
                <Button variant="text" onClick={() => navigate('/admin/orders')}>Cancel</Button>
                <Button variant="contained" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Order'}</Button>
              </Stack>
            </Box>
          </Box>

          {error && <Typography color="error">{error}</Typography>}
        </Stack>
      </form>
    </Paper>
  );
}