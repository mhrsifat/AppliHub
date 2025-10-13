// src/features/order/components/OrderAssignment.jsx
/**
 * src/features/order/components/OrderAssignment.jsx
 *
 * A feature-rich, minimal MUI component to assign or unassign an employee
 * to an order. Integrates useOrders() + useEmployees().
 * Designed to be used inside a Dialog (like in OrderList.jsx).
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import { UserIcon } from "@heroicons/react/24/outline";
import useEmployees from "@/features/employee/hooks/useEmployees";
import useOrders from "../hooks/useOrders";
import { Select, MenuItem, InputLabel, FormControl, Chip } from "@mui/material";

export default function OrderAssignment({ order, onClose }) {
  const { assign, unassign } = useOrders();
  const { list: employees, loading, onSearch, load } = useEmployees(1, 50);

  const [selected, setSelected] = useState(order?.assigned_to ?? null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    load(1, "", locationFilter ? { location: locationFilter } : {});
  }, [load, locationFilter]);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // useOrders.assign expects (orderId, employeeId)
      await assign(order.id, selected);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    try {
      await unassign(order.id);
      onClose?.(); 
    } finally {
      setSaving(false);
    }
  };

  // derive unique locations from the employee list for the filter dropdown
  const locations = useMemo(() => {
    const set = new Set();
    (employees || []).forEach((e) => {
      if (e.location) set.add(e.location);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    let base = employees || [];
    if (search.trim()) {
      base = base.filter(
        (e) =>
          (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (e.phone || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return base;
  }, [employees, search]);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {order?.assigned_to
          ? `Currently assigned to: ${order.assigned_to_name ?? "Unknown"}`
          : "This order is not assigned"}
      </Typography>

      <TextField
        size="small"
        fullWidth
        placeholder="Search employees..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onSearch(e.target.value);
        }}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="loc-label">Filter by location</InputLabel>
        <Select
          labelId="loc-label"
          value={locationFilter}
          label="Filter by location"
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <MenuItem value="">All locations</MenuItem>
          {locations.map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 1,
        }}
      >
        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense disablePadding>
            {filtered.map((e) => (
              <React.Fragment key={e.id}>
                <ListItem
                  button
                  selected={selected === e.id}
                  onClick={() => setSelected(e.id)}
                >
                  <ListItemAvatar>
                    <Avatar src={e.avatar ?? undefined}>
                      {!e.avatar && <UserIcon width={18} />}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={e.name}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textSecondary"
                        >
                          {e.email ?? ""} {e.phone ? "• " + e.phone : ""}
                        </Typography>
                        {e.location && (
                          <span
                            style={{ display: "inline-block", marginLeft: 8 }}
                          >
                            <Chip size="small" label={e.location} />
                          </span>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}

            {filtered.length === 0 && (
              <Box p={3} textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  No employees found.
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Box>

      <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
        {order?.assigned_to && (
          <Button
            variant="outlined"
            color="error"
            disabled={saving}
            onClick={handleUnassign}
          >
            {saving ? "Unassigning..." : "Unassign"}
          </Button>
        )}
        <Button
          variant="contained"
          disabled={!selected || saving}
          onClick={handleAssign}
        >
          {saving ? "Assigning..." : "Assign"}
        </Button>
      </Stack>
    </Box>
  );
}
