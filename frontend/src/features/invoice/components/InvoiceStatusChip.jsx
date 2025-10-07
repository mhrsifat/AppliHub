// src/features/invoice/components/InvoiceStatusChip.jsx
import React from "react";
import { Chip } from "@mui/material";

const map = {
  issued: "info",
  draft: "default",
  partially_paid: "warning",
  paid: "success",
  refunded: "default",
  cancelled: "error",
};

export default function InvoiceStatusChip({ status }) {
  return <Chip label={status?.replace("_"," ")} color={map[status] || "default"} size="small" />;
}
