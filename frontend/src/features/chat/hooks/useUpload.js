// filepath: src/features/chat/hooks/useUpload.js
import { useState, useCallback } from 'react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_TYPES.image,
  ...ALLOWED_TYPES.video,
  ...ALLOWED_TYPES.document
];

export const useUpload = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);

  const validateFile = useCallback((file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 50MB.`;
    }
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return `File "${file.name}" type is not supported.`;
    }
    return null;
  }, []);

  const generatePreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const preview = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result,
          isImage: ALLOWED_TYPES.image.includes(file.type),
          isVideo: ALLOWED_TYPES.video.includes(file.type),
          isDocument: ALLOWED_TYPES.document.includes(file.type)
        };
        resolve(preview);
      };

      if (ALLOWED_TYPES.image.includes(file.type) || ALLOWED_TYPES.video.includes(file.type)) {
        reader.readAsDataURL(file);
      } else {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: null,
          isImage: false,
          isVideo: false,
          isDocument: true
        });
      }
    });
  }, []);

  const addFiles = useCallback(async (newFiles) => {
    const fileArray = Array.from(newFiles);
    const validationErrors = [];
    const validFiles = [];
    const newPreviews = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
        const preview = await generatePreview(file);
        newPreviews.push(preview);
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setErrors(validationErrors);

    return { validFiles, errors: validationErrors };
  }, [validateFile, generatePreview]);

  const removeFile = useCallback((previewId) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.id === previewId);
      if (removed) {
        setFiles(current => current.filter(f => f !== removed.file));
      }
      return prev.filter(p => p.id !== previewId);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setErrors([]);
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  return {
    files,
    previews,
    errors,
    addFiles,
    removeFile,
    clearAll,
    formatFileSize
  };
};