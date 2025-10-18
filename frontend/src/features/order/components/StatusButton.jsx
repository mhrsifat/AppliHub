import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  ListItemText,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { changeOrderStatus } from "../slices/orderSlice";

const STATUSES = ["pending", "confirmed", "processing", "completed", "cancelled"];

export default function StatusButton({ order, onStatusChange }) {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState(order?.status ?? "pending");
  const buttonRef = useRef(null);

  useEffect(() => {
    setLocalStatus(order?.status ?? "pending");
  }, [order?.status]);

  const openMenu = (e) => setAnchorEl(e.currentTarget);

  const closeMenu = () => {
    setAnchorEl(null);
    // Focus back to button for accessibility
    buttonRef.current?.focus();
  };

  const handleChange = async (newStatus) => {
    if (!order || saving) return;

    const prev = localStatus;
    setLocalStatus(newStatus);
    setSaving(true);
    closeMenu();

    try {
      await dispatch(changeOrderStatus({ orderId: order.id, status: newStatus })).unwrap();
      if (onStatusChange) onStatusChange(order.id, newStatus);
    } catch (err) {
      console.error("Status update failed", err);
      setLocalStatus(prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        ref={buttonRef}
        size="small"
        variant="outlined"
        onClick={openMenu}
        disabled={saving}
      >
        {saving ? <CircularProgress size={16} /> : <ListItemText primary={localStatus} />}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        keepMounted
        disableAutoFocusItem
        disableEnforceFocus
      >
        {STATUSES.map((s) => (
          <MenuItem key={s} selected={s === localStatus} onClick={() => handleChange(s)}>
            {s}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
