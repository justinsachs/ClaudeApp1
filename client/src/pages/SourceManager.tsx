import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Source {
  id: string;
  title: string;
  source_type: string;
  file_path?: string;
  authority_level: string;
  uploaded_at: string;
  version?: string;
}

export default function SourceManager() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('authority_level', 'primary');

      try {
        const response = await fetch('http://localhost:3000/api/uploads/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          console.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    setUploading(false);
    setTimeout(() => {
      setUploadProgress({});
      loadSources();
    }, 1000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: true
  });

  const getFileIcon = () => {
    return <DocumentTextIcon className="h-12 w-12 text-primary-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAuthorityBadge = (level: string) => {
    const colors = {
      primary: 'bg-green-100 text-green-800',
      secondary: 'bg-blue-100 text-blue-800',
      internal: 'bg-gray-100 text-gray-800'
    };
    return colors[level as keyof typeof colors] || colors.internal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Source Materials</h1>
          <p className="text-lg text-gray-600">
            Upload and manage your course source documents
          </p>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transition-all hover:shadow-2xl">
          <div
            {...getRootProps()}
            className={`
              border-3 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive
                ? 'border-primary-500 bg-primary-50 scale-105'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />

            {uploading ? (
              <div className="space-y-3">
                <p className="text-lg font-medium text-gray-700">Uploading files...</p>
                <div className="max-w-md mx-auto space-y-2">
                  {Object.entries(uploadProgress).map(([filename, progress]) => (
                    <div key={filename} className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="truncate max-w-xs">{filename}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-xl font-semibold text-primary-700 mb-2">Drop files here</p>
                <p className="text-gray-600">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-gray-500 mb-4">
                  Supports PDF, DOCX, and DOC files (up to 10MB each)
                </p>
                <button className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg">
                  Choose Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sources List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">
              Uploaded Sources ({sources.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading sources...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sources yet</h3>
              <p className="text-gray-500">Upload your first source document to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {source.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDate(source.uploaded_at)}
                        </span>

                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAuthorityBadge(source.authority_level)}`}>
                          {source.authority_level}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {source.source_type.toUpperCase()}
                        </span>

                        {source.version && (
                          <span className="text-xs text-gray-400">
                            v{source.version}
                          </span>
                        )}
                      </div>

                      {source.file_path && (
                        <p className="mt-2 text-xs text-gray-400 font-mono truncate">
                          {source.file_path}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {sources.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-blue-100 text-sm font-medium mb-1">Total Sources</p>
              <p className="text-3xl font-bold">{sources.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-green-100 text-sm font-medium mb-1">Primary Sources</p>
              <p className="text-3xl font-bold">
                {sources.filter(s => s.authority_level === 'primary').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-purple-100 text-sm font-medium mb-1">Recent Uploads</p>
              <p className="text-3xl font-bold">
                {sources.filter(s => {
                  const daysSince = (Date.now() - new Date(s.uploaded_at).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince < 7;
                }).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
