// src/features/invoice/pages/InvoiceCreatePage.jsx
import React, { useState } from "react";
import { Paper, TextField, Button, Grid } from "@mui/material";
import useInvoices from "../hooks/useInvoices";
import { useNavigate } from "react-router-dom";

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const { createInvoice } = useInvoices();
  const [form, setForm] = useState({
    order_id: "",
    vat_percent: 0,
    coupon_discount: 0,
    items: [{ service_name: "", description: "", unit_price: 0, quantity: 1 }],
  });

  function setItem(idx, key, value) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: value };
    setForm({ ...form, items });
  }
  function addRow() { setForm({ ...form, items: [...form.items, { service_name: "", description: "", unit_price: 0, quantity: 1 }] }); }
  function removeRow(idx) { setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }); }

  async function submit() {
    const res = await createInvoice(form);
    if (res.meta?.requestStatus === "fulfilled") navigate(`${res.payload.id}`);
  }

  return (
    <Paper className="p-6 bg-surface text-text space-y-4">
      <h2 className="text-lg font-medium">Create Invoice</h2>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField label="Order ID (required)" value={form.order_id}
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            fullWidth />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField label="VAT %" value={form.vat_percent}
            onChange={(e) => setForm({ ...form, vat_percent: e.target.value })}
            fullWidth />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField label="Coupon discount" value={form.coupon_discount}
            onChange={(e) => setForm({ ...form, coupon_discount: e.target.value })}
            fullWidth />
        </Grid>
      </Grid>

      <div className="space-y-2">
        <h3 className="font-medium">Items</h3>
        {form.items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <TextField label="Service name" value={it.service_name}
                onChange={(e) => setItem(idx, "service_name", e.target.value)} fullWidth />
            </div>
            <div className="col-span-4">
              <TextField label="Description" value={it.description}
                onChange={(e) => setItem(idx, "description", e.target.value)} fullWidth />
            </div>
            <div className="col-span-2">
              <TextField label="Price" type="number" value={it.unit_price}
                onChange={(e) => setItem(idx, "unit_price", parseFloat(e.target.value || 0))} fullWidth />
            </div>
            <div className="col-span-1">
              <TextField label="Qty" type="number" value={it.quantity}
                onChange={(e) => setItem(idx, "quantity", parseInt(e.target.value || 1))}
                fullWidth />
            </div>
            <div className="col-span-1">
              <Button color="error" onClick={() => removeRow(idx)}>Remove</Button>
            </div>
          </div>
        ))}

        <div>
          <Button onClick={addRow}>Add item</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outlined" onClick={() => navigate("/")}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Create Invoice</Button>
      </div>
    </Paper>
  );
}
