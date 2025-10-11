// useBlogs.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBlogs,
  deleteBlog,
  fetchCategories,
  fetchTags,
} from "../slices/blogSlice";

export default function useBlogs(params = {}) {
  const dispatch = useDispatch();
  const { list, meta, loading, categories, tags } = useSelector((s) => s.blogs);

  useEffect(() => {
    dispatch(fetchBlogs(params));
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch, params]);

  const onDelete = (id) => {
    if (!confirm("Delete blog?")) return;
    dispatch(deleteBlog(id));
  };

  return { list, meta, loading, categories, tags, onDelete };
}
