// src/features/invoice/components/InvoiceTable.jsx
import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import InvoiceStatusChip from "./InvoiceStatusChip";
import { motion } from "framer-motion";

export default function InvoiceTable({ invoices = [], onSelect }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id} hover className="cursor-pointer" onClick={() => onSelect?.(inv)}>
              <TableCell>{inv.invoice_number}</TableCell>
              <TableCell>{inv.order_id}</TableCell>
              <TableCell>{inv.type}</TableCell>
              <TableCell>${inv.grand_total?.toFixed(2)}</TableCell>
              <TableCell>${(inv.paid_amount ?? 0).toFixed(2)}</TableCell>
              <TableCell><InvoiceStatusChip status={inv.status} /></TableCell>
              <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
