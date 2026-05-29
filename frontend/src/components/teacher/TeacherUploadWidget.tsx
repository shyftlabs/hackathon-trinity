// Component for teacher to upload files to a class
"use client";

import { useState, useRef } from 'react';
import { uploadFilesToClass } from '@/lib/classUtils';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface TeacherUploadProps {
  classCode: string;
  onSuccess?: () => void;
}

export function TeacherUploadWidget({ classCode, onSuccess }: TeacherUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>(['notes', 'flashcards']);

  const modes = [
    { id: 'notes', label: 'Notes' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'podcast', label: 'Audio' },
    { id: 'visual', label: 'Mind Map' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (selectedModes.length === 0) {
      setError('Please select at least one study mode');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await uploadFilesToClass(classCode, files, selectedModes);
      
      setSuccess(`✓ ${result.filesCount} file(s) uploaded! Students will see the updated materials on next login.`);
      setFiles([]);
      setSelectedModes(['notes', 'flashcards']);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleMode = (mode: string) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-[#1d1d1f]/12 bg-white p-6">
      <div>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Upload Materials</h3>
        <p className="text-[13px] text-[#6e6e73] mt-1">
          Replace or update class materials. Students will see changes on next login.
        </p>
      </div>

      {/* File Input */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-[#0066cc]/30 bg-[#0066cc]/5 p-6 text-center transition hover:border-[#0066cc]/50 hover:bg-[#0066cc]/10"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.mp3,.wav,.m4a,.mp4,.webm"
        />
        <Upload className="mx-auto mb-2 size-5 text-[#0066cc]" strokeWidth={1.5} />
        <p className="text-[15px] font-medium text-[#1d1d1f]">
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select files'}
        </p>
        <p className="text-[13px] text-[#6e6e73] mt-1">
          PDF, DOCX, images, audio, video — up to 50MB each
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[#1d1d1f]">Selected Files:</p>
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-[#f5f5f7] p-3">
              <span className="text-[13px] text-[#424245] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="p-1 hover:bg-[#1d1d1f]/10 rounded"
              >
                <X className="size-4 text-[#6e6e73]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mode Selection */}
      <div>
        <p className="text-[13px] font-medium text-[#1d1d1f] mb-2">Study Modes to Generate:</p>
        <div className="flex flex-wrap gap-2">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => toggleMode(mode.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                selectedModes.includes(mode.id)
                  ? 'bg-[#0066cc] text-white'
                  : 'border border-[#1d1d1f]/12 bg-white text-[#424245] hover:border-[#1d1d1f]/20'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-2 rounded-lg bg-red-50 p-3 border border-red-200">
          <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex gap-2 rounded-lg bg-green-50 p-3 border border-green-200">
          <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-green-700">{success}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        className="w-full h-11 rounded-full bg-[#0066cc] text-white font-medium transition-all duration-150 hover:bg-[#0071e3] disabled:opacity-60 active:scale-[0.97]"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Uploading...
          </div>
        ) : (
          'Upload & Update Class'
        )}
      </button>
    </div>
  );
}
