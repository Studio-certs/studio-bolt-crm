import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, Trash2, AlertCircle, Loader2, ExternalLink, File, Image, FileVideo, FileAudio, File as FilePdf, FileCode, FileSpreadsheet, Presentation as FilePresentation, FileArchive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LeadFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  file_path: string;
  profiles: {
    name: string;
  } | null;
}

interface LeadFilesProps {
  leadId: string;
}

export const LeadFiles: React.FC<LeadFilesProps> = ({ leadId }) => {
  const { state: { user } } = useAuth();
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('lead_files')
        .select(`
          id,
          file_name,
          file_size,
          mime_type,
          uploaded_at,
          file_path,
          profiles ( name )
        `)
        .eq('lead_id', leadId)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      setError('Invalid lead ID format');
      return;
    }
    fetchFiles();
  }, [fetchFiles, leadId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFile = async (file: File) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required. Please log in again.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-lead-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload file';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      await fetchFiles();

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    try {
      const { error: dbDeleteError } = await supabase
        .from('lead_files')
        .delete()
        .eq('id', fileId);

      if (dbDeleteError) throw dbDeleteError;

      setFiles(files.filter(f => f.id !== fileId));

    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-6 w-6" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-6 w-6" />;
    if (mimeType === 'application/pdf') return <FilePdf className="h-6 w-6" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-6 w-6" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <FilePresentation className="h-6 w-6" />;
    if (mimeType.includes('compressed') || mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="h-6 w-6" />;
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return <FileCode className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Files & Attachments</h2>
          <span className="text-sm text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-3 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        <div
          className={`relative mb-6 ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-500'
          } border-2 border-dashed rounded-lg transition-colors`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="p-8 text-center">
            <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Any file type up to 50MB</p>
            
            {isUploading && (
              <div className="mt-4 flex items-center justify-center text-sm text-indigo-600">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Uploading...
              </div>
            )}
          </div>
        </div>

        {isLoading && !isUploading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">Upload files to get started</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul role="list" className="divide-y divide-gray-200">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="hover:bg-gray-50 transition-colors py-4 px-4 sm:px-6 flex items-center"
                >
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0 text-gray-400">
                      {getFileIcon(file.mime_type)}
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div className="flex items-center space-x-2">
                        <a
                          href={file.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate flex items-center group"
                        >
                          {file.file_name}
                          <ExternalLink className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                        <span>{formatBytes(file.file_size)}</span>
                        <span>•</span>
                        <span>Uploaded by {file.profiles?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteFile(file.id, file.file_name)}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all"
                      title={`Delete ${file.file_name}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
