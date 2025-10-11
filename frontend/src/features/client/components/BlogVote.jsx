// BlogVote.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { voteBlog } from "../slices/clientBlogSlice";

export default function BlogVote({ blog }) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const vote = async (type) => {
    setLoading(true);
    try {
      await dispatch(voteBlog({ blogId: blog.id, voteType: type }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 mt-4">
      <button
        disabled={loading}
        onClick={() => vote("up")}
        className="px-3 py-1 rounded border"
      >
        👍 {blog.upvotes || 0}
      </button>
      <button
        disabled={loading}
        onClick={() => vote("down")}
        className="px-3 py-1 rounded border"
      >
        👎 {blog.downvotes || 0}
      </button>
    </div>
  );
}
