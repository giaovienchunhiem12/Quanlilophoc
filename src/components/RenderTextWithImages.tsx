import React from 'react';

interface RenderTextWithImagesProps {
  text: string;
  images?: { [key: string]: string };
}

export default function RenderTextWithImages({ text, images }: RenderTextWithImagesProps) {
  if (!text) return null;
  if (!images || Object.keys(images).length === 0) {
    return <span>{text}</span>;
  }

  // Matches placeholders like [HÌNH_ẢNH_1], [HÌNH_ẢNH_2], etc.
  const regex = /(\[HÌNH_ẢNH_\d+\])/g;
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.match(/^\[HÌNH_ẢNH_\d+\]$/)) {
          const src = images[part];
          if (src) {
            return (
              <span key={index} className="block my-3 max-w-full text-center no-print">
                <img 
                  src={src} 
                  alt={part} 
                  className="max-h-72 object-contain mx-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs" 
                  referrerPolicy="no-referrer"
                />
              </span>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
