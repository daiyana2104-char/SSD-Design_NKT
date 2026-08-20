import { useRef, useState } from 'react';
import { UploadCloud, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FileUpload({
  label,
  accept = 'image/*',
  preview,
  onFile,
  className,
}: {
  label?: string;
  accept?: string;
  preview?: string;
  onFile?: (file: File) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFile = (file: File) => {
    setFileName(file.name);
    onFile?.(file);
  };

  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragging ? 'border-maroon-400 bg-maroon-50' : 'border-brown-200 hover:border-maroon-300 hover:bg-cream-50',
        )}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="h-28 w-28 rounded-lg object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFileName(''); }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-2 text-sm text-brown-600">
            <FileText className="h-5 w-5 text-maroon-500" />
            {fileName}
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-brown-300" />
            <p className="mt-2 text-sm text-brown-500">Click or drag to upload</p>
            <p className="text-xs text-brown-400">{accept === 'image/*' ? 'PNG, JPG up to 2MB' : accept}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
