
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { uploadToGCS } from '@/lib/gcs-upload';
import { useUser } from '@/firebase';

export default function TestUploadPage() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setResult(null);

    try {
      const uploadResult = await uploadToGCS(file, 'test-uploads', user.uid);
      setResult(uploadResult);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload</CardTitle>
          <CardDescription>
            Test if GCS uploads are working. Upload a test image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <p className="text-red-500">Please log in first to test uploads.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Select Image</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <div className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Test Image
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span className="font-medium">Upload Successful!</span>
                      </div>
                      {result.url && (
                        <div className="text-sm">
                          <p className="font-medium">URL:</p>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 underline break-all"
                          >
                            {result.url}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="mr-2 h-4 w-4" />
                      <span>Upload Failed: {result.error}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
