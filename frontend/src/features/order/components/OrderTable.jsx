// src/features/order/components/OrderTable.jsx
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from "@mui/material";
import OrderStatusChip from "./OrderStatusChip";
import { motion } from "framer-motion";

export default function OrderTable({ orders, loading, onSelect }) {
  if (loading) return <div className="flex justify-center p-6"><CircularProgress /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order #</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id} hover onClick={() => onSelect?.(o)} className="cursor-pointer">
              <TableCell>{o.order_number}</TableCell>
              <TableCell>${o.grand_total}</TableCell>
              <TableCell><OrderStatusChip status={o.status} /></TableCell>
              <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
