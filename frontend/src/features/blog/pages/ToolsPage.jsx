// src/features/blog/pages/ToolsPage.jsx
import React, { useState } from "react";
import { Button } from "@mui/material";
import api from "../../../services/api";

export default function ToolsPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // adjust endpoint if you have one, e.g., /admin/blogs/export
      const res = await api.get("/admin/blogs/export", { responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blogs-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed or endpoint missing");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      // adjust endpoint if exists, e.g., /admin/blogs/import
      await api.post("/admin/blogs/import", form, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Import finished (check server response).");
    } catch (err) {
      console.error(err);
      alert("Import failed or endpoint missing");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Tools</h2>

      <div className="bg-white p-4 rounded shadow max-w-xl space-y-4">
        <div>
          <Button variant="contained" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export Blogs (CSV)"}
          </Button>
        </div>

        <div>
          <input id="import-file" type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          <label htmlFor="import-file">
            <Button component="span" variant="outlined" disabled={importing}>
              {importing ? "Importing..." : "Import Blogs (CSV)"}
            </Button>
          </label>
        </div>

        <div className="text-sm text-gray-500">
          Export/Import endpoints are optional. If you don't have them server-side, these buttons will show an alert.
        </div>
      </div>
    </div>
  );
}
