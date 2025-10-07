// src/features/invoice/components/InvoiceItemRow.jsx
import React from "react";
import { TableRow, TableCell, IconButton } from "@mui/material";
import { Trash2, Edit } from "lucide-react";

export default function InvoiceItemRow({ item, onEdit, onDelete }) {
  return (
    <TableRow>
      <TableCell>{item.service_name}</TableCell>
      <TableCell>{item.description}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{item.unit_price?.toFixed(2)}</TableCell>
      <TableCell>${item.line_total?.toFixed(2)}</TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onEdit?.(item)}><Edit className="w-4 h-4" /></IconButton>
        <IconButton size="small" onClick={() => onDelete?.(item)}><Trash2 className="w-4 h-4 text-red-500" /></IconButton>
      </TableCell>
    </TableRow>
  );
}
