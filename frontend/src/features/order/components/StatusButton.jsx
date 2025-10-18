// filepath: src/features/order/components/StatusButton.jsx 
import React, { useState, useEffect } from "react"; import { Button, Menu, MenuItem, CircularProgress, ListItemText } from "@mui/material"; import { useDispatch } from "react-redux"; import { changeOrderStatus } from "../slices/orderSlice";

const STATUSES = ["pending", "confirmed", "processing", "completed", "cancelled"];

export default function StatusButton({ order }) { const dispatch = useDispatch(); const [anchorEl, setAnchorEl] = useState(null); const [saving, setSaving] = useState(false); const [localStatus, setLocalStatus] = useState(order?.status ?? "pending");

useEffect(() => { // keep localStatus in sync if store changes the order prop
setLocalStatus(order?.status ?? "pending"); }, [order?.status]);

const openMenu = (e) => setAnchorEl(e.currentTarget); const closeMenu = () => setAnchorEl(null);

const handleChange = async (newStatus) => { if (!order || saving) return;

// optimistic UI change
const prev = localStatus;
setLocalStatus(newStatus);
setSaving(true);
closeMenu();

try {
  // dispatch returns a promise; unwrap to get the fulfilled payload or throw
  await dispatch(changeOrderStatus({ orderId: order.id, status: newStatus })).unwrap();
  // success -> store will be updated by the slice; localStatus already matches
} catch (err) {
  // revert on error
  console.error("Status update failed", err);
  setLocalStatus(prev);
  // optionally show a toast / error UI here
} finally {
  setSaving(false);
}

};

return ( <> <Button size="small" variant="outlined" onClick={openMenu} disabled={saving}> {saving ? <CircularProgress size={16} /> : <ListItemText primary={localStatus} />} </Button>

<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
    {STATUSES.map((s) => (
      <MenuItem key={s} selected={s === localStatus} onClick={() => handleChange(s)}>
        {s}
      </MenuItem>
    ))}
  </Menu>
</>

); }

