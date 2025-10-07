// src/features/order/components/OrderItemRow.jsx
import React from "react";
import { TableRow, TableCell, IconButton } from "@mui/material";
import { Trash2 } from "lucide-react";

export default function OrderItemRow({ item, onDelete }) {
  return (
    <TableRow>
      <TableCell>{item.service_name}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>${item.unit_price}</TableCell>
      <TableCell>${item.line_total}</TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onDelete?.(item)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
