// filepath: src/features/chat/components/AttachmentPreview.jsx 
import React from 'react';

export default function AttachmentPreview({ file, onRemove }) { return ( <div className="w-28 h-20 rounded border p-1 relative"> {file.type.startsWith('image') ? ( <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded" /> ) : file.type.startsWith('video') ? ( <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" /> ) : ( <div className="text-xs">{file.name}</div> )} <button onClick={onRemove} className="absolute top-0 right-0 text-xs bg-white rounded-full p-1">✕</button> </div> ); }

