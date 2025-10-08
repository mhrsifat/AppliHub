// src/features/order/components/OrderTable.jsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import OrderStatusChip from "./OrderStatusChip";

export default function OrderTable({ orders, loading, onSelect }) {
  if (loading)
    return (
      <div className="flex justify-center p-6">
        <CircularProgress />
      </div>
    );

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order #</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Number</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o, idx) => (
            <TableRow
              key={o.id ?? o.order_number ?? idx}
              hover
              onClick={() => onSelect?.(o)}
              className="cursor-pointer"
            >
              <TableCell>{o.order_number}</TableCell>
              <TableCell>{o.guest_name}</TableCell>
              <TableCell>{o.guest_phone}</TableCell>
              <TableCell>{o.guest_email}</TableCell>
              <TableCell>${o.grand_total}</TableCell>
              <TableCell>
                <OrderStatusChip status={o.status} />
              </TableCell>
              <TableCell>
                {new Date(o.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
