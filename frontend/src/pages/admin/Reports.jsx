// filepath: src/features/invoice/pages/Reports.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "@/services/api";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/stats/dashboard");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">Failed to load report data.</Typography>
      </Box>
    );
  }

  const {
    total_revenue,
    total_refunds,
    total_invoices,
    paid_invoices_count,
    unpaid_invoices_count,
    total_due,
    monthly_revenue,
    recent_invoices,
  } = stats;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="600" mb={3}>
        Reports Dashboard
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={2}>
        {[
          { label: "Total Revenue", value: total_revenue, color: "#16a34a" },
          { label: "Total Refunds", value: total_refunds, color: "#dc2626" },
          { label: "Total Due", value: total_due, color: "#f59e0b" },
          { label: "Total Invoices", value: total_invoices, color: "#2563eb" },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                backgroundColor: `${stat.color}15`,
                borderLeft: `5px solid ${stat.color}`,
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h6" fontWeight="600" color={stat.color}>
                  {stat.value.toLocaleString()} ৳
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} mt={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Monthly Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Payment Summary
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { name: "Paid", value: paid_invoices_count },
                    { name: "Unpaid", value: unpaid_invoices_count },
                    { name: "Total", value: total_invoices },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Invoices */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Recent Invoices
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent_invoices?.length ? (
                  recent_invoices.map((inv, i) => (
                    <TableRow key={inv.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{inv.invoice_number}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor:
                              inv.status === "paid"
                                ? "#16a34a20"
                                : inv.status === "cancelled"
                                ? "#dc262620"
                                : "#facc1520",
                            color:
                              inv.status === "paid"
                                ? "#16a34a"
                                : inv.status === "cancelled"
                                ? "#dc2626"
                                : "#f59e0b",
                            fontWeight: 500,
                            fontSize: 12,
                            textTransform: "capitalize",
                          }}
                        >
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell>{inv.order?.order_number ?? "-"}</TableCell>
                      <TableCell>{inv.grand_total.toLocaleString()} ৳</TableCell>
                      <TableCell>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
