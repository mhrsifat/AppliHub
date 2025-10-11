// src/features/blog/pages/CommentsPage.jsx
import React, { useEffect, useState } from "react";
import { Button, IconButton, TextField } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import api from "../../../services/api";

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // admin comments endpoint (adjust if different)
      const res = await api.get("/admin/blogs/comments");
      // expecting paginated shape
      setComments(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete comment?")) return;
    try {
      await api.delete(`/admin/blogs/comments/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const openReply = (comment) => {
    setReplyingTo(comment);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      // admin reply endpoint from earlier: POST /comments/{id}/reply
      await api.post(`/comments/${replyingTo.id}/reply`, {
        comment_text: replyText,
      });
      setReplyingTo(null);
      setReplyText("");
      await load();
    } catch (err) {
      console.error(err);
      alert("Reply failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Comments Moderation</h2>

      <div className="bg-white rounded shadow">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="p-4">No comments found.</div>
        ) : (
          <ul className="divide-y">
            {comments.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{c.user_name || "Guest"}</div>
                    <div className="text-sm text-gray-700">{c.comment_text}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>

                    {c.replies?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {c.replies.map((r) => (
                          <div key={r.id} className="ml-4 p-2 border-l">
                            <div className="text-sm font-medium">{r.user_name}</div>
                            <div className="text-sm">{r.comment_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <IconButton size="small" onClick={() => openReply(c)}><ReplyIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {replyingTo && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Reply to {replyingTo.user_name || "Guest"}</h3>
          <TextField
            label="Reply text"
            multiline
            rows={3}
            fullWidth
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="my-2"
          />
          <div className="flex space-x-2">
            <Button variant="contained" onClick={sendReply}>Send Reply</Button>
            <Button variant="text" onClick={() => setReplyingTo(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
