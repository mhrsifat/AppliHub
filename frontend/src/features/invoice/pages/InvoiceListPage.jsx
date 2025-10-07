// src/features/invoice/pages/InvoiceListPage.jsx
import React, { useEffect } from "react";
import { Button, CircularProgress } from "@mui/material";
import InvoiceTable from "../components/InvoiceTable";
import useInvoices from "../hooks/useInvoices";
import { useNavigate } from "react-router-dom";

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const { list, loading, fetchInvoices } = useInvoices(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="p-6 space-y-4 bg-background text-text">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <div className="flex gap-2">
          <Button variant="outlined" onClick={() => fetchInvoices()}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate("/invoices/create")}>New Invoice</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-6"><CircularProgress /></div>
      ) : (
        <InvoiceTable invoices={list} onSelect={(i) => navigate(`/invoices/${i.id}`)} />
      )}
    </div>
  );
}
