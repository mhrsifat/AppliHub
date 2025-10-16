// filepath: src/features/chat/components/AttachmentPreview.jsx
import React from 'react';
import { X, FileText, File, Image, Video } from 'lucide-react';

const AttachmentPreview = ({ previews, onRemove, formatFileSize }) => {
  if (previews.length === 0) return null;

  const getIcon = (preview) => {
    if (preview.isImage) return <Image className="w-4 h-4" />;
    if (preview.isVideo) return <Video className="w-4 h-4" />;
    if (preview.type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex flex-wrap gap-2">
        {previews.map((preview) => (
          <div
            key={preview.id}
            className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors"
          >
            {/* Preview */}
            {preview.isImage && preview.url && (
              <div className="w-20 h-20">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {preview.isVideo && preview.url && (
              <div className="w-20 h-20 relative">
                <video
                  src={preview.url}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <Video className="w-6 h-6 text-white" />
                </div>
              </div>
            )}

            {preview.isDocument && (
              <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100">
                {getIcon(preview)}
                <span className="text-xs text-gray-600 mt-1 truncate w-full px-2 text-center">
                  {preview.name.split('.').pop().toUpperCase()}
                </span>
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => onRemove(preview.id)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>

            {/* File info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white truncate">{preview.name}</p>
              <p className="text-xs text-gray-300">{formatFileSize(preview.size)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPreview;