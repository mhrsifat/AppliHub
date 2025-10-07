// src/features/order/components/OrderStatusChip.jsx
import React from "react";
import { Chip } from "@mui/material";

const colors = {
  pending: "warning",
  processing: "info",
  completed: "success",
  cancelled: "error",
};

export default function OrderStatusChip({ status }) {
  return <Chip label={status} color={colors[status] || "default"} size="small" />;
}
