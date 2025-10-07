// src/features/invoice/components/PaymentList.jsx
import React from "react";
import { List, ListItem, ListItemText, ListItemSecondaryAction } from "@mui/material";

export default function PaymentList({ payments = [] }) {
  if (!payments.length) return <div className="text-sm text-muted">No payments yet</div>;

  return (
    <List dense>
      {payments.map((p) => (
        <ListItem key={p.id}>
          <ListItemText primary={`$${(+p.amount).toFixed(2)} — ${p.method}`} secondary={p.payment_reference || p.note} />
          <ListItemSecondaryAction className="pr-4">
            <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</div>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
