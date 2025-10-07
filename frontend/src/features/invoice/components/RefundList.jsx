// src/features/invoice/components/RefundList.jsx
import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";

export default function RefundList({ refunds = [] }) {
  if (!refunds.length) return <div className="text-sm text-muted">No refunds</div>;

  return (
    <List dense>
      {refunds.map((r) => (
        <ListItem key={r.id}>
          <ListItemText primary={`$${(+r.amount).toFixed(2)} — ${r.reason}`} secondary={r.note} />
          <div className="text-xs text-gray-500 ml-4">{new Date(r.created_at).toLocaleString()}</div>
        </ListItem>
      ))}
    </List>
  );
}
