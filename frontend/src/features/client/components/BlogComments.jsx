// BlogComments.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addComment, addReply } from "../slices/clientBlogSlice";

function CommentItem({ c, onReply }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const dispatch = useDispatch();

  const submitReply = async () => {
    if (!text.trim()) return;
    await dispatch(
      addReply({
        blogId: c.blog_id,
        payload: { user_name: "Guest", comment_text: text, parent_id: c.id },
      })
    );
    setText("");
    setOpen(false);
    if (onReply) onReply();
  };

  return (
    <div className="border-l pl-3 py-2">
      <div className="font-medium">{c.user_name}</div>
      <div className="text-sm">{c.comment_text}</div>
      <div
        className="text-xs text-blue-600 cursor-pointer mt-1"
        onClick={() => setOpen(!open)}
      >
        Reply
      </div>

      {open && (
        <div className="mt-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded p-2"
            rows={2}
          />
          <div className="mt-2">
            <button
              onClick={submitReply}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {c.replies?.map((r) => (
        <div key={r.id} className="ml-4 mt-2 text-sm border-l pl-3">
          <div className="font-medium">{r.user_name}</div>
          <div>{r.comment_text}</div>
        </div>
      ))}
    </div>
  );
}

export default function BlogComments({ blogId, comments = [], refresh }) {
  const [text, setText] = useState("");

  const dispatch = useDispatch();

  const submit = async () => {
    if (!text.trim()) return;
    await dispatch(
      addComment({
        blogId,
        payload: { user_name: "Guest", comment_text: text },
      })
    );
    setText("");
    if (refresh) refresh();
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Comments</h3>
      <textarea
        className="w-full border rounded p-2"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2">
        <button
          onClick={submit}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Post Comment
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {comments.map((c) => (
          <CommentItem key={c.id} c={c} onReply={refresh} />
        ))}
      </div>
    </div>
  );
}
