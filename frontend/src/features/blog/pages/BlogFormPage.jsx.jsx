// filepath: src/features/blog/pages/BlogFormPage.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPost, addCategory, addTag } from '../slices/blogSlice';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export default function BlogFormPage() {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState('');

  const addNewTag = () => {
    if (!tagInput.trim()) return;
    dispatch(addTag({ name: tagInput, slug: tagInput.toLowerCase().replace(/\s+/g, '-') }));
    setTags((t) => [...t, { name: tagInput }]);
    setTagInput('');
  };

  const addNewCategory = () => {
    if (!categoryName.trim()) return;
    dispatch(addCategory({ name: categoryName, slug: categoryName.toLowerCase().replace(/\s+/g, '-') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Backend accepts category_name & tags (array of names) in current controller implementation
    const payload = {
      title,
      excerpt,
      content,
      category_name: categoryName || undefined,
      tags: tags.map(t => t.name || t),
    };
    try {
      await dispatch(createPost(payload)).unwrap();
      // Reset or redirect
      setTitle(''); setExcerpt(''); setContent(''); setTags([]); setCategoryName('');
      alert('Post created');
    } catch (err) {
      console.error('create failed', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded p-2" />
        </div>

        <div>
          <label className="block font-medium">Excerpt</label>
          <textarea value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} className="w-full border rounded p-2" rows={3} />
        </div>

        <div>
          <label className="block font-medium">Category (name)</label>
          <input value={categoryName} onChange={(e)=>setCategoryName(e.target.value)} className="border rounded p-2" />
          <button type="button" onClick={addNewCategory} className="ml-2 px-2 py-1 bg-green-600 text-white rounded">Add</button>
        </div>

        <div>
          <label className="block font-medium">Tags</label>
          <div className="flex items-center">
            <input value={tagInput} onChange={(e)=>setTagInput(e.target.value)} className="border rounded p-2 mr-2" />
            <button type="button" onClick={addNewTag} className="px-2 py-1 bg-green-600 text-white rounded">Add Tag</button>
          </div>
          <div className="mt-2">
            {tags.map((t, i) => <span key={i} className="inline-block bg-gray-200 px-2 py-0.5 mr-1 rounded">{t.name || t}</span>)}
          </div>
        </div>

        <div>
          <label className="block font-medium">Content</label>
          <CKEditor
            editor={ClassicEditor}
            data={content}
            onChange={(event, editor) => setContent(editor.getData())}
            config={{ toolbar: ['bold','italic','link','bulletedList','numberedList'] }}
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </form>
    </div>
  );
}
