// src/features/order/pages/OrderListPage.jsx
import React, { useEffect } from "react";
import useOrders from "../hooks/useOrders";
import OrderTable from "../components/OrderTable";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function OrderListPage() {
  const navigate = useNavigate();
  const { list, loading, fetchOrders } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6 space-y-4 bg-background text-text">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Button variant="contained" onClick={() => navigate("create")}>New Order</Button>
      </div>
      <OrderTable orders={list} loading={loading} onSelect={(o) => navigate(`${o.id}`)} />
    </div>
  );
}
