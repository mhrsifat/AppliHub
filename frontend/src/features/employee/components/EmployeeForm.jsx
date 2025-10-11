// src/features/employee/components/EmployeeForm.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

const defaultValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  status: "active",
  roles: [],
  location: "",
  full_address: "",
};

export default function EmployeeForm({
  open,
  onClose,
  onSubmit,
  initial = null,
  rolesOptions = [],
}) {
  const [values, setValues] = useState(defaultValues);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (initial) {
      setValues({
        ...defaultValues,
        ...initial,
        // ensure controlled inputs are never null
        location: initial.location ?? "",
        full_address: initial.full_address ?? "",
        password: "",
        password_confirmation: "",
      });
      setPreview(initial.avatar ?? null);
    } else {
      setValues(defaultValues);
      setPreview(null);
    }
    setAvatarFile(null);
  }, [initial, open]);

  function handleChange(e) {
    const { name, value } = e.target;
    const safe = value == null ? "" : value;
    setValues((v) => ({ ...v, [name]: safe }));
  }

  function handleRoleChange(e) {
    const raw = e.target.value;
    const val = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    setValues((v) => ({ ...v, roles: val }));
  }

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  function submit(e) {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(values).forEach((k) => {
      if ((k === "password" || k === "password_confirmation") && !values[k])
        return;
      if (k === "roles") {
        (values.roles || []).forEach((r) => formData.append("roles[]", r));
      } else {
        formData.append(k, values[k] ?? "");
      }
    });

    if (avatarFile) formData.append("avatar", avatarFile);

    onSubmit(formData);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit Employee" : "Create Employee"}</DialogTitle>
      <form onSubmit={submit} encType="multipart/form-data">
        <DialogContent dividers>
          <Box className="flex gap-4 items-center mb-4">
            <Avatar src={preview} sx={{ width: 64, height: 64 }} />
            <label htmlFor="avatar-upload">
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="avatar-upload"
                type="file"
                onChange={pickFile}
              />
              <IconButton component="span" aria-label="upload" size="small">
                <PhotoCamera />
              </IconButton>
            </label>
            <div className="text-muted-text text-sm">Max 2MB. JPG/PNG.</div>
          </Box>

          <Box className="grid grid-cols-2 gap-4">
            <TextField
              label="First name"
              name="first_name"
              value={values.first_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Last name"
              name="last_name"
              value={values.last_name}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              value={values.email}
              onChange={handleChange}
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={values.phone}
              onChange={handleChange}
            />
            <TextField
              label="Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              type="password"
              helperText={initial ? "Leave blank to keep current password" : ""}
            />
            <TextField
              label="Confirm Password"
              name="password_confirmation"
              value={values.password_confirmation}
              onChange={handleChange}
              type="password"
            />
          </Box>

          <Box className="mt-4 grid grid-cols-2 gap-4">
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                name="status"
                value={values.status}
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="roles-label">Roles</InputLabel>
              <Select
                labelId="roles-label"
                label="Roles"
                multiple
                name="roles"
                value={values.roles}
                onChange={handleRoleChange}
                renderValue={(selected) => selected.join(", ")}
              >
                {rolesOptions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="mt-4 grid grid-cols-2 gap-4">
            <FormControl fullWidth>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                label="Location"
                name="location"
                value={values.location}
                onChange={handleChange}
              >
                <MenuItem value="">Select location</MenuItem>
                <MenuItem value="Dhaka">Dhaka</MenuItem>
                <MenuItem value="Narayanganj">Narayanganj</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Full address"
              name="full_address"
              value={values.full_address}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
