// filepath: src/features/chat/hooks/useUpload.js 
import { useCallback, useState } from 'react';
export default function useUpload({ maxFiles = 5 } = {}) { const [files, setFiles] = useState([]);

const addFiles = useCallback((incoming) => { let arr = Array.isArray(incoming) ? incoming : [incoming]; arr = arr.slice(0, Math.max(0, maxFiles - files.length)); setFiles(prev => [...prev, ...arr]); }, [files.length, maxFiles]);

const removeFile = useCallback((index) => { setFiles(prev => prev.filter((_, i) => i !== index)); }, []);

const clear = useCallback(() => setFiles([]), []);

return { files, addFiles, removeFile, clear }; }

