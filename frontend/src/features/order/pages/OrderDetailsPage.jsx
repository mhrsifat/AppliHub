// src/features/order/pages/OrderDetailsPage.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useOrders from "../hooks/useOrders";
import { CircularProgress, Paper } from "@mui/material";
import OrderItemRow from "../components/OrderItemRow";
import OrderStatusChip from "../components/OrderStatusChip";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { current, loading, fetchOrder } = useOrders();

  useEffect(() => { fetchOrder(id); }, [id]);

  if (loading || !current) return <div className="flex justify-center p-10"><CircularProgress /></div>;

  return (
    <Paper className="p-6 bg-surface text-text">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Order #{current.order_number}</h2>
        <OrderStatusChip status={current.status} />
      </div>

      <div className="mt-4 space-y-2">
        <div>Total: ${current.grand_total}</div>
        <div>VAT: {current.vat_percent}% (${current.vat_amount})</div>
        <div>Coupon: ${current.coupon_discount}</div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-2">Items</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Service</th><th>Qty</th><th>Price</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {current.items?.map((i) => <OrderItemRow key={i.id} item={i} />)}
          </tbody>
        </table>
      </div>
    </Paper>
  );
}
