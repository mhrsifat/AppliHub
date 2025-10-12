// src/features/blog/pages/SettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Switch, FormControlLabel, TextField, Button } from "@mui/material";

export default function SettingsPage() {
  // Lightweight local settings UI. Wire to API if you store settings server-side.
  const [oneViewWindowHours, setOneViewWindowHours] = useState(24);
  const [moderateComments, setModerateComments] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    // load from localStorage as default, replace with API call if exists
    const json = localStorage.getItem("blog_settings");
    if (json) {
      const parsed = JSON.parse(json);
      setOneViewWindowHours(parsed.oneViewWindowHours ?? 24);
      setModerateComments(parsed.moderateComments ?? true);
    }
  }, []);

  const save = () => {
    const payload = { oneViewWindowHours, moderateComments };
    localStorage.setItem("blog_settings", JSON.stringify(payload));
    setSaveMsg("Settings saved locally. Hook this to API if needed.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Blog Settings</h2>

      <div className="bg-white p-4 rounded shadow grid gap-4 max-w-xl">
        <TextField
          label="Unique view window (hours)"
          type="number"
          value={oneViewWindowHours}
          onChange={(e) => setOneViewWindowHours(Number(e.target.value))}
          helperText="How many hours to count a single IP as one view (default 24)."
        />

        <FormControlLabel
          control={<Switch checked={moderateComments} onChange={(e) => setModerateComments(e.target.checked)} />}
          label="Enable comment moderation"
        />

        <div className="flex items-center space-x-3">
          <Button variant="contained" onClick={save}>Save Settings</Button>
          <div className="text-sm text-gray-500">{saveMsg}</div>
        </div>
      </div>
    </div>
  );
}
