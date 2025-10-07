// src/features/order/pages/OrderCreatePage.jsx
import React, { useState } from "react";
import { TextField, Button, Paper } from "@mui/material";
import useOrders from "../hooks/useOrders";
import { useNavigate } from "react-router-dom";

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const [form, setForm] = useState({ customer_id: "", vat_percent: 0 });

  const handleSubmit = async () => {
    const res = await createOrder(form);
    if (res.meta.requestStatus === "fulfilled") navigate(`admin/orders/${res.payload.id}`);
  };

  return (
    <Paper className="p-6 bg-surface text-text space-y-4">
      <h2 className="text-lg font-medium">Create Order</h2>
      <TextField label="Customer ID (optional)" fullWidth
        value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} />
      <TextField label="VAT %" fullWidth
        value={form.vat_percent} onChange={(e) => setForm({ ...form, vat_percent: e.target.value })} />
      <Button variant="contained" onClick={handleSubmit}>Create</Button>
    </Paper>
  );
}
