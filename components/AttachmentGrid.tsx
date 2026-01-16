
import React from 'react';

interface AttachmentGridProps {
  attachments: string[];
}

const AttachmentGrid: React.FC<AttachmentGridProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`grid gap-1 mt-2 ${attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {attachments.map((url, idx) => (
        <div key={idx} className="rounded-lg overflow-hidden border border-black/5 bg-slate-100 aspect-square">
          <img 
            src={url} 
            alt={`Anexo ${idx + 1}`} 
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            onClick={() => window.open(url, '_blank')}
          />
        </div>
      ))}
    </div>
  );
};

export default AttachmentGrid;
