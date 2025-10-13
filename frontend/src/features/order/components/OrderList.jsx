// src/features/order/components/OrderList.jsx
/**
 * Minimal, feature-rich order list using MUI + heroicons.
 * - Removed bulk selection features.
 * - Per-row actions: View, Edit, Invoice, Assign (opens OrderAssignment dialog).
 * - Uses useOrders() hook for data + actions.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from "@mui/material";
import {
  EyeIcon,
  PencilSquareIcon,
  ReceiptPercentIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import useOrders from "../hooks/useOrders";
import OrderAssignment from "./OrderAssignment";
import { useSelector } from "react-redux";

export default function OrderList() {
  const navigate = useNavigate();
  const {
    list = [],
    meta,
    loading,
    error,
    page,
    setPage,
    perPage,
    setPerPage,
    load,
    search,
    q,
    assign,
    unassign,
    getOne,
  } = useOrders({ initialPage: 1, perPage: 10 });

  const isLoading = Boolean(loading?.list ?? loading);
  const [searchTerm, setSearchTerm] = useState(q ?? "");
  const { admin } = useSelector((state) => state.auth);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    load(); /* initial load handled in hook too */
  }, []); // eslint-disable-line

  const openAssign = async (order) => {
    // make sure we have freshest order in store
    await getOne(order.id);
    setActiveOrder(order);
    setAssignDialogOpen(true);
  };

  const closeAssign = () => {
    setAssignDialogOpen(false);
    setActiveOrder(null);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setPage(1);
  };

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        gap={2}
      >
        <Typography variant="h6">Orders</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search order / customer / phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              search(e.target.value);
            }}
          />
          <Select size="small" value={perPage} onChange={handlePerPageChange}>
            <MenuItem value={10}>10 / page</MenuItem>
            <MenuItem value={25}>25 / page</MenuItem>
            <MenuItem value={50}>50 / page</MenuItem>
          </Select>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/orders/create")}
          >
            New Order
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? (
          <Box p={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order#</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(list || []).map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {o.order_number}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString()
                          : ""}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>
                          {o.customer_name ?? "Guest"}
                        </span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {o.customer_phone ?? o.customer_email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell align="right">
                      {Number(o.grand_total ?? 0).toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor:
                            o.payment_status === "paid"
                              ? "success.light"
                              : o.payment_status === "partially_paid"
                              ? "warning.light"
                              : "error.light",
                          color:
                            o.payment_status === "paid"
                              ? "success.dark"
                              : o.payment_status === "partially_paid"
                              ? "warning.dark"
                              : "error.dark",
                          fontSize: 12,
                        }}
                      >
                        {o.payment_status ?? "unpaid"}
                      </Box>
                    </TableCell>

                    <TableCell>{o.status ?? "-"}</TableCell>

                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                          title="View"
                        >
                          <EyeIcon style={{ width: 18, height: 18 }} />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/orders/${o.id}/edit`)}
                          title="Edit"
                        >
                          <PencilSquareIcon style={{ width: 18, height: 18 }} />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate("/admin/invoices/create", {
                              state: { fromOrderId: o.id },
                            })
                          }
                          title="Create Invoice"
                        >
                          <ReceiptPercentIcon
                            style={{ width: 18, height: 18 }}
                          />
                        </IconButton>

                        {admin && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openAssign(o)}
                            startIcon={
                              <UserIcon style={{ width: 16, height: 16 }} />
                            }
                          >
                            {o.assigned_to ? "Reassign" : "Assign"}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {(!list || list.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No orders found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box
          p={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2">
            Total: {meta?.total ?? list.length}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={
                meta?.last_page ??
                Math.max(
                  1,
                  Math.ceil(
                    (meta?.total ?? list.length) / (meta?.per_page ?? perPage)
                  )
                )
              }
              page={meta?.current_page ?? page}
              onChange={(_, p) => setPage(p)}
              size="small"
            />
          </Stack>
        </Box>
      </Paper>

      <Dialog
        open={assignDialogOpen}
        onClose={closeAssign}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {activeOrder
            ? `Assign Order #${activeOrder.order_number ?? activeOrder.id}`
            : "Assign Order"}
        </DialogTitle>
        <DialogContent dividers>
          {/* Reuse your existing OrderAssignment component which handles fetching employees, assign/unassign */}
          {activeOrder && (
            <OrderAssignment order={activeOrder} onClose={closeAssign} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssign}>Close</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Box mt={2}>
          <Typography color="error">{String(error)}</Typography>
        </Box>
      )}
    </Box>
  );
}
