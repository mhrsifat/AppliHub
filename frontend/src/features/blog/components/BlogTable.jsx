// BlogTable.jsx
import React from "react";
import { Button } from "@mui/material";

export default function BlogTable({ blogs = [], loading, onEdit, onDelete, onPreview }) {
  if (loading) return <div>Loading...</div>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Views</th>
            <th className="p-3 text-left">Votes</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {blogs.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="p-3">{b.title}</td>
              <td className="p-3">{b.category?.name || "—"}</td>
              <td className="p-3">{b.views}</td>
              <td className="p-3">{(b.upvotes || 0) - (b.downvotes || 0)}</td>
              <td className="p-3 text-right space-x-2">
                <Button size="small" variant="outlined" onClick={() => onEdit(b)}>Edit</Button>
                <Button size="small" variant="contained" onClick={() => onPreview(b)}>Preview</Button>
                <Button size="small" color="error" variant="outlined" onClick={() => onDelete(b.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
