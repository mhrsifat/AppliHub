import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from "@mui/material";
import {
  EyeIcon,
  ReceiptPercentIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import useOrders from "../hooks/useOrders";
import OrderAssignment from "./OrderAssignment";
import StatusButton from "./StatusButton";
import { useSelector } from "react-redux";

export default function OrderList() {
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
    getOne,
  } = useOrders({ initialPage: 1, perPage: 10 });

  const isLoading = Boolean(loading?.list ?? loading);
  const [searchTerm, setSearchTerm] = useState(q ?? "");
  const { admin, employee } = useSelector((state) => state.auth);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  const reflink = () => (admin ? "/admin/" : employee ? "/employee/" : "/");

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const openAssign = async (order) => {
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
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
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
          <Button component={Link} to={`${reflink()}orders/create`} variant="contained">
            New Order
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
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
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No orders found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {list.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{o.order_number}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>{o.customer_name ?? "Guest"}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {o.customer_phone ?? o.customer_email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell align="right">{Number(o.grand_total ?? 0).toFixed(2)}</TableCell>

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

                    <TableCell>
                      <StatusButton order={o} />
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          component={Link}
                          to={`${reflink()}orders/${o.id}`}
                          startIcon={<EyeIcon style={{ width: 18, height: 18 }} />}
                          size="small"
                        >
                          View
                        </Button>

                        <Button
                          component={Link}
                          to={`${reflink()}invoices/create`}
                          state={{ fromOrderId: o.id }}
                          startIcon={<ReceiptPercentIcon style={{ width: 18, height: 18 }} />}
                          size="small"
                        >
                          Invoice
                        </Button>

                        {admin && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openAssign(o)}
                            startIcon={<UserIcon style={{ width: 16, height: 16 }} />}
                          >
                            {o.assigned_to ? "Reassign" : "Assign"}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">Total: {meta?.total ?? list.length}</Typography>
          <Pagination
            count={meta?.last_page ?? Math.max(1, Math.ceil((meta?.total ?? list.length) / (meta?.per_page ?? perPage)))}
            page={meta?.current_page ?? page}
            onChange={(_, p) => setPage(p)}
            size="small"
          />
        </Box>
      </Paper>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={closeAssign} fullWidth maxWidth="sm">
        <DialogTitle>
          {activeOrder ? `Assign Order #${activeOrder.order_number ?? activeOrder.id}` : "Assign Order"}
        </DialogTitle>
        <DialogContent dividers>
          {activeOrder && <OrderAssignment order={activeOrder} onClose={closeAssign} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssign}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Error */}
      {error && (
        <Box mt={2}>
          <Typography color="error">{String(error)}</Typography>
        </Box>
      )}
    </Box>
  );
}
