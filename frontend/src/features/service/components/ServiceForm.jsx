// ServiceForm.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Grid,
  Avatar,
  IconButton,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import AddonSelector from "./AddonSelector";

export default function ServiceForm({
  initialValues = {},
  onSubmit,
  submitting = false,
}) {
  const [values, setValues] = useState({
    title: "",
    sku: "",
    slug: "",
    description: "",
    price: "",
    vat_percent: 0,
    vat_applicable: true,
    price_includes_vat: false,
    is_active: true,
    ...initialValues,
  });
  const [iconFile, setIconFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [iconDeleted, setIconDeleted] = useState(false);

  useEffect(() => {
    // Merge initialValues into state safely:
    // - ignore keys with undefined (don't overwrite existing)
    // - convert null -> '' for controlled inputs
    // - only set state when there's a real change to avoid render loops
    if (!initialValues || Object.keys(initialValues).length === 0) return;

    setValues((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.keys(initialValues).forEach((key) => {
        const val = initialValues[key];
        if (val === undefined) return; // don't overwrite with undefined

        // Convert null to empty string for controlled inputs
        const safeVal = val === null ? "" : val;

        // Only assign if different (shallow)
        // Use String comparison for numbers/strings to avoid false positives
        const prevVal = next[key];
        const prevCmp = prevVal === undefined ? "" : prevVal;
        const nextCmp = safeVal === undefined ? "" : safeVal;
        if (prevCmp !== nextCmp) {
          next[key] = safeVal;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
    // set preview from initialValues.icon if present
    if (initialValues && initialValues.icon) {
      setPreview(initialValues.icon);
    }
  }, [initialValues]);

  useEffect(() => {
    // cleanup object URL when iconFile changes or on unmount
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // resize image to limit dimensions (keeps quality reasonable)
  function resizeImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (img.width > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth / ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas is empty"));
            const newFile = new File([blob], file.name, { type: blob.type });
            resolve(newFile);
          },
          file.type || "image/jpeg",
          0.9
        );
      };
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(file);
    });
  }

  function set(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // resize then store
    resizeImage(file, 800)
      .then((f) => {
        setIconFile(f);
        const url = URL.createObjectURL(f);
        setPreview(url);
        set("icon", null); // clear any string URL to rely on uploaded file
        setIconDeleted(false);
      })
      .catch((err) => {
        console.error("Image resize failed", err);
        // fallback to original file
        setIconFile(file);
        setPreview(URL.createObjectURL(file));
      });
  }

  function removeIcon() {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setIconFile(null);
    set("icon", "");
    setIconDeleted(true);
  }

  function submit(e) {
    e.preventDefault();
    // If there's a file, submit as FormData
    const price = Number(values.price || 0);
    const vat_percent = Number(values.vat_percent || 0);

    if (iconFile) {
      const fd = new FormData();
      // append all values
      Object.keys(values).forEach((k) => {
        if (k === "icon") return; // icon handled separately
        const v = values[k];
        // arrays (e.g., addons) handled as multiple entries
        if (Array.isArray(v)) {
          v.forEach((item) => fd.append(`${k}[]`, item ?? ""));
        } else if (typeof v === "boolean") {
          // Laravel boolean rule accepts 1/0 or true/false as booleans in JSON.
          // For multipart/form-data, send '1' or '0' to be parsed as boolean.
          fd.append(k, v ? "1" : "0");
        } else {
          fd.append(k, v ?? "");
        }
      });
      fd.set("price", price);
      fd.set("vat_percent", vat_percent);
      fd.append("icon", iconFile);
      if (iconDeleted) fd.append("icon_delete", "1");
      onSubmit(fd);
    } else {
      // Ensure boolean-like values are actual booleans for JSON payload
      const payload = {
        ...values,
        price,
        vat_percent,
        vat_applicable: Boolean(values.vat_applicable),
        price_includes_vat: Boolean(values.price_includes_vat),
        is_active: Boolean(values.is_active),
      };
      if (iconDeleted) payload.icon_delete = true;
      onSubmit(payload);
    }
  }

  return (
    <Paper className="p-4">
      <form onSubmit={submit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Box className="flex flex-col items-start gap-2">
              <Avatar
                src={preview || values.icon || ""}
                sx={{ width: 64, height: 64 }}
              />
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="service-icon-upload"
                type="file"
                onChange={pickFile}
              />
              <label htmlFor="service-icon-upload">
                <IconButton
                  component="span"
                  size="small"
                  aria-label="upload icon"
                >
                  <PhotoCamera />
                </IconButton>
              </label>
              <IconButton
                size="small"
                onClick={removeIcon}
                aria-label="remove icon"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <div className="text-muted-text text-sm">
                Upload icon (JPG/PNG). Max width 800px.
              </div>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Title"
              value={values.title}
              fullWidth
              required
              onChange={(e) => set("title", e.target.value)}
            />
          </Grid>
          {/* <Grid item xs={12} md={3}>
            <TextField
              label="SKU"
              value={values.sku}
              fullWidth
              onChange={(e) => set("sku", e.target.value)}
            />
          </Grid> */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Slug"
              value={values.slug}
              fullWidth
              onChange={(e) => set("slug", e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              value={values.description}
              fullWidth
              multiline
              rows={3}
              onChange={(e) => set("description", e.target.value)}
            />
          </Grid>

          {/* <Grid item xs={12} md={4}>
            <TextField
              label="Price"
              value={values.price}
              fullWidth
              type="number"
              onChange={(e) => set("price", e.target.value)}
            />
          </Grid> */}

          {/* <Grid item xs={12} md={4}>
            <TextField
              label="VAT (%)"
              value={values.vat_percent}
              fullWidth
              type="number"
              onChange={(e) => set("vat_percent", e.target.value)}
            />
          </Grid> */}

          <Grid item xs={12} md={4} className="flex items-center">
            {/* <FormControlLabel
              control={
                <Switch
                  checked={values.vat_applicable}
                  onChange={(e) => set("vat_applicable", e.target.checked)}
                />
              }
              label="VAT applicable"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.price_includes_vat}
                  onChange={(e) => set("price_includes_vat", e.target.checked)}
                />
              }
              label="Price includes VAT"
            /> */}
            <FormControlLabel
              control={
                <Switch
                  checked={values.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>

          {/* <Grid item xs={12}>
            <AddonSelector
              serviceId={initialValues.id}
              selectedAddons={values.addons || []}
              onChange={(addons) => set("addons", addons)}
            />
          </Grid> */}

          <Grid item xs={12} className="flex justify-end gap-2">
            <Button variant="outlined" onClick={() => {}}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
