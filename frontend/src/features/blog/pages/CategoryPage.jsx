// src/features/blog/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react";
import { TextField, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { blogService } from "../services/blogService";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await blogService.categories();
      setCategories(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setSlug("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await blogService.updateCategory(editing.id, { name, slug });
      } else {
        await blogService.createCategory({ name, slug });
      }
      await load();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete category?")) return;
    try {
      await blogService.removeCategory(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Category Management</h2>

      <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-3 items-end">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <div>
          <Button type="submit" variant="contained">
            {editing ? "Update" : "Create"}
          </Button>
          {editing && (
            <Button onClick={resetForm} variant="text" className="ml-2">
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="p-4">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="3" className="p-4">No categories yet.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.slug}</td>
                  <td className="p-3 text-right">
                    <IconButton size="small" onClick={() => handleEdit(c)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
