// ServiceForm.jsx
import React, { useState, useEffect } from 'react';
import { Box, TextField, Switch, FormControlLabel, Button, Paper, Grid } from '@mui/material';
import AddonSelector from './AddonSelector';

export default function ServiceForm({ initialValues = {}, onSubmit, submitting = false }) {
  const [values, setValues] = useState({
    title: '',
    sku: '',
    slug: '',
    description: '',
    price: '',
    vat_percent: 0,
    vat_applicable: true,
    price_includes_vat: false,
    is_active: true,
    ...initialValues
  });

  useEffect(() => setValues(v => ({ ...v, ...initialValues })), [initialValues]);

  function set(k, v) {
    setValues(prev => ({ ...prev, [k]: v }));
  }

  function submit(e) {
    e.preventDefault();
    const payload = {
      ...values,
      price: Number(values.price || 0),
      vat_percent: Number(values.vat_percent || 0)
    };
    onSubmit(payload);
  }

  return (
    <Paper className="p-4">
      <form onSubmit={submit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Title" value={values.title} fullWidth required onChange={e => set('title', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="SKU" value={values.sku} fullWidth onChange={e => set('sku', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Slug" value={values.slug} fullWidth onChange={e => set('slug', e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <TextField label="Description" value={values.description} fullWidth multiline rows={3} onChange={e => set('description', e.target.value)} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField label="Price" value={values.price} fullWidth type="number" onChange={e => set('price', e.target.value)} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField label="VAT (%)" value={values.vat_percent} fullWidth type="number" onChange={e => set('vat_percent', e.target.value)} />
          </Grid>

          <Grid item xs={12} md={4} className="flex items-center">
            <FormControlLabel control={<Switch checked={values.vat_applicable} onChange={e => set('vat_applicable', e.target.checked)} />} label="VAT applicable" />
            <FormControlLabel control={<Switch checked={values.price_includes_vat} onChange={e => set('price_includes_vat', e.target.checked)} />} label="Price includes VAT" />
            <FormControlLabel control={<Switch checked={values.is_active} onChange={e => set('is_active', e.target.checked)} />} label="Active" />
          </Grid>

          <Grid item xs={12}>
            <AddonSelector serviceId={initialValues.id} selectedAddons={values.addons || []} onChange={addons => set('addons', addons)} />
          </Grid>

          <Grid item xs={12} className="flex justify-end gap-2">
            <Button variant="outlined" onClick={() => { }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
