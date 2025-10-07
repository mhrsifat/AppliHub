// src/features/invoice/pages/InvoiceDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useInvoices from "../hooks/useInvoices";
import { Paper, CircularProgress, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import InvoiceItemRow from "../components/InvoiceItemRow";
import PaymentList from "../components/PaymentList";
import RefundList from "../components/RefundList";
import InvoiceStatusChip from "../components/InvoiceStatusChip";

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current, fetchInvoice, addInvoiceItem, removeInvoiceItem, recordPayment, refundInvoice, clearCurrent, loading } = useInvoices(true);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [itemData, setItemData] = useState({ service_name: "", description: "", unit_price: 0, quantity: 1 });

  useEffect(() => { fetchInvoice(id); return () => clearCurrent(); }, [id]);

  if (loading || !current) return <div className="flex justify-center p-10"><CircularProgress /></div>;

  async function handleAddItem() {
    await addInvoiceItem(current.id, itemData);
    setShowItemDialog(false);
    setItemData({ service_name: "", description: "", unit_price: 0, quantity: 1 });
    fetchInvoice(id);
  }

  async function handleDeleteItem(item) {
    await removeInvoiceItem(current.id, item.id);
    fetchInvoice(id);
  }

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: "cash", payment_reference: "" });

  async function handleRecordPayment() {
    await recordPayment(current.id, paymentData);
    setShowPaymentDialog(false);
    setPaymentData({ amount: 0, method: "cash", payment_reference: "" });
    fetchInvoice(id);
  }

  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundData, setRefundData] = useState({ amount: 0, reason: "" });

  async function handleRefund() {
    await refundInvoice(current.id, refundData);
    setShowRefundDialog(false);
    setRefundData({ amount: 0, reason: "" });
    fetchInvoice(id);
  }

  return (
    <Paper className="p-6 bg-surface text-text space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Invoice {current.invoice_number}</h2>
          <div className="text-sm text-gray-500">Order #{current.order_id} • Created {new Date(current.created_at).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-4">
          <InvoiceStatusChip status={current.status} />
          <Button onClick={() => navigate("/")}>Back</Button>
        </div>
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <h3 className="font-medium">Items</h3>
          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Service</th><th className="p-2">Qty</th><th className="p-2">Unit</th><th className="p-2">Total</th><th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {current.items?.map((it) => (
                <InvoiceItemRow key={it.id} item={it} onEdit={() => {}} onDelete={() => handleDeleteItem(it)} />
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <div>
              <Button variant="outlined" onClick={() => setShowItemDialog(true)}>Add Item</Button>
            </div>

            <div className="text-right">
              <div>Subtotal: ${(+current.subtotal).toFixed(2)}</div>
              <div>VAT ({current.vat_percent}%): ${(+current.vat_amount).toFixed(2)}</div>
              <div>Coupon: -${(+current.coupon_discount).toFixed(2)}</div>
              <div className="text-lg font-semibold">Grand Total: ${(+current.grand_total).toFixed(2)}</div>
              <div className="text-sm">Paid: ${(+current.paid_amount).toFixed(2)} — Balance: ${(current.grand_total - (current.paid_amount || 0)).toFixed(2)}</div>
            </div>
          </div>
        </Grid>

        <Grid item xs={12} md={4}>
          <div className="space-y-4">
            <div className="p-4 bg-background rounded">
              <h4 className="font-medium">Payments</h4>
              <PaymentList payments={current.payments || []} />
              <div className="mt-2 flex gap-2">
                <Button variant="contained" onClick={() => setShowPaymentDialog(true)}>Record Payment</Button>
              </div>
            </div>

            <div className="p-4 bg-background rounded">
              <h4 className="font-medium">Refunds</h4>
              <RefundList refunds={current.refunds || []} />
              <div className="mt-2">
                <Button variant="outlined" onClick={() => setShowRefundDialog(true)}>Issue Refund</Button>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>

      <Dialog open={showItemDialog} onClose={() => setShowItemDialog(false)} fullWidth>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField label="Service name" value={itemData.service_name} onChange={(e) => setItemData({...itemData, service_name: e.target.value})} fullWidth />
          <TextField label="Description" value={itemData.description} onChange={(e) => setItemData({...itemData, description: e.target.value})} fullWidth />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Unit price" type="number" value={itemData.unit_price} onChange={(e) => setItemData({...itemData, unit_price: parseFloat(e.target.value || 0)})} />
            <TextField label="Quantity" type="number" value={itemData.quantity} onChange={(e) => setItemData({...itemData, quantity: parseInt(e.target.value || 1)})} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowItemDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField label="Amount" type="number" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value || 0)})} fullWidth />
          <TextField label="Method" value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})} fullWidth />
          <TextField label="Reference" value={paymentData.payment_reference} onChange={(e) => setPaymentData({...paymentData, payment_reference: e.target.value})} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained">Record</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showRefundDialog} onClose={() => setShowRefundDialog(false)} fullWidth>
        <DialogTitle>Issue Refund</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField label="Amount" type="number" value={refundData.amount} onChange={(e) => setRefundData({...refundData, amount: parseFloat(e.target.value || 0)})} fullWidth />
          <TextField label="Reason" value={refundData.reason} onChange={(e) => setRefundData({...refundData, reason: e.target.value})} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRefundDialog(false)}>Cancel</Button>
          <Button onClick={handleRefund} variant="contained">Refund</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
