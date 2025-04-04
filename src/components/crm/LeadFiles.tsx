import React, { useState, useEffect, useCallback } from 'react';
      import { supabase } from '../../lib/supabase';
      import { Upload, FileText, Trash2, AlertCircle, Loader2 } from 'lucide-react';
      import { useAuth } from '../../context/AuthContext';

      interface LeadFile {
        id: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        uploaded_at: string;
        file_path: string; // Path in IBM COS
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
            setError('Failed to load files.');
          } finally {
            setIsLoading(false);
          }
        }, [leadId]);

        useEffect(() => {
          fetchFiles();
        }, [fetchFiles]);

        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await uploadFile(file);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };

        const uploadFile = async (file: File) => {
          setIsUploading(true);
          setError(null);

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('leadId', leadId);

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
              throw new Error('User not authenticated');
            }

            const { data, error: functionError } = await supabase.functions.invoke('upload-lead-file', {
              body: formData,
              headers: {
                Authorization: `Bearer ${sessionData.session.access_token}`,
                // Content-Type is automatically set by browser for FormData
              },
            });

            if (functionError) {
              console.error('Function invocation error:', functionError);
              // Try to parse Supabase Edge Function error
              let message = 'Upload failed.';
              if (functionError.context && functionError.context.error) {
                 message = functionError.context.error.message || message;
              } else if (typeof functionError.message === 'string' && functionError.message.includes('{')) {
                 try {
                   const parsed = JSON.parse(functionError.message.substring(functionError.message.indexOf('{')));
                   message = parsed.error || message;
                 } catch(e) { /* ignore parsing error */ }
              } else if (functionError.message) {
                 message = functionError.message;
              }
              throw new Error(message);
            }

            if (data?.error) {
              throw new Error(data.error);
            }

            // Refresh file list on successful upload
            await fetchFiles();

          } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during upload.');
          } finally {
            setIsUploading(false);
          }
        };

        const handleDeleteFile = async (fileId: string, filePath: string) => {
          if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
          }

          setError(null);
          try {
            // 1. Delete from Supabase DB first
            const { error: dbDeleteError } = await supabase
              .from('lead_files')
              .delete()
              .eq('id', fileId);

            if (dbDeleteError) throw dbDeleteError;

            // 2. Delete from IBM COS (Consider doing this via another Edge Function for security)
            // For simplicity here, we assume the user has permissions or this is handled elsewhere.
            // In a production scenario, trigger a backend process or another function
            // to delete from COS based on the filePath.
            console.warn(`Deletion from IBM COS for path "${filePath}" needs to be implemented securely (e.g., via another Edge Function).`);

            // Refresh file list
            setFiles(files.filter(f => f.id !== fileId));

          } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete file.');
          }
        };

        const formatBytes = (bytes: number, decimals = 2) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const dm = decimals < 0 ? 0 : decimals;
          const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        };

        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-900">&times;</button>
              </div>
            )}

            {/* Upload Area */}
            <div className="mb-6">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span className="text-indigo-600 hover:text-indigo-500">Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        ref={fileInputRef}
                      />
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Any file type up to 50MB</p>
                  </div>
                </div>
              </label>
              {isUploading && (
                <div className="mt-2 flex items-center text-sm text-indigo-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Uploading...
                </div>
              )}
            </div>

            {/* File List */}
            {isLoading && !isUploading ? (
              <div className="text-center py-4">
                <Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" />
              </div>
            ) : files.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No files uploaded yet.</p>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li key={file.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <FileText className="h-6 w-6 text-gray-400 flex-shrink-0 mr-3" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatBytes(file.file_size)} - Uploaded by {file.profiles?.name || 'Unknown'} on {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {/* Add download button if needed, requires secure URL generation */}
                      {/* <button className="text-indigo-600 hover:text-indigo-900"><Download className="h-5 w-5" /></button> */}
                      <button
                        onClick={() => handleDeleteFile(file.id, file.file_path)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete file"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      };
