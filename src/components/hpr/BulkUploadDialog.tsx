/**
 * Bulk Upload Dialog for Reference Data
 * CSV import for reference data tables
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface BulkUploadDialogProps {
  tableName: string;
  tableDisplayName: string;
  columns: { name: string; required: boolean; type: string }[];
  onComplete: () => void;
}

export const BulkUploadDialog = ({
  tableName,
  tableDisplayName,
  columns,
  onComplete,
}: BulkUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const downloadTemplate = () => {
    const headers = columns.map(c => c.name).join(',');
    const sampleRow = columns.map(c => {
      if (c.type === 'boolean') return 'true';
      if (c.type === 'number') return '0';
      return `sample_${c.name}`;
    }).join(',');
    
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error('No data found in file');
        setUploading(false);
        return;
      }

      const errors: { row: number; error: string }[] = [];
      let successCount = 0;

      // Validate required columns exist
      const requiredColumns = columns.filter(c => c.required).map(c => c.name);
      const fileHeaders = Object.keys(rows[0]);
      const missingColumns = requiredColumns.filter(c => !fileHeaders.includes(c));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        setUploading(false);
        return;
      }

      // Process rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(Math.round(((i + 1) / rows.length) * 100));

        // Validate required fields
        const missingFields = requiredColumns.filter(c => !row[c]);
        if (missingFields.length > 0) {
          errors.push({ row: i + 2, error: `Missing required fields: ${missingFields.join(', ')}` });
          continue;
        }

        // Transform data types
        const transformedRow: Record<string, any> = {};
        for (const col of columns) {
          if (row[col.name] !== undefined) {
            if (col.type === 'boolean') {
              transformedRow[col.name] = row[col.name].toLowerCase() === 'true';
            } else if (col.type === 'number') {
              transformedRow[col.name] = parseFloat(row[col.name]) || 0;
            } else {
              transformedRow[col.name] = row[col.name];
            }
          }
        }

        // Insert row
        const { error } = await supabase
          .from(tableName as any)
          .insert(transformedRow);

        if (error) {
          errors.push({ row: i + 2, error: error.message });
        } else {
          successCount++;
        }
      }

      setResults({
        total: rows.length,
        success: successCount,
        errors,
      });

      if (errors.length === 0) {
        toast.success(`Successfully imported ${successCount} records`);
        onComplete();
      } else if (successCount > 0) {
        toast.warning(`Imported ${successCount} of ${rows.length} records. ${errors.length} errors.`);
        onComplete();
      } else {
        toast.error('Import failed - no records imported');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload: {tableDisplayName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Download Template</p>
              <p className="text-sm text-muted-foreground">
                Get the CSV template with correct column headers
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Column Info */}
          <div className="text-sm">
            <p className="font-medium mb-2">Required Columns:</p>
            <div className="flex flex-wrap gap-1">
              {columns.filter(c => c.required).map(c => (
                <span key={c.name} className="px-2 py-1 bg-primary/10 rounded text-xs">
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* File Input */}
          <div>
            <Label>Select CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processing... {progress}%
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{results.success} imported</span>
                </div>
                {results.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>{results.errors.length} errors</span>
                  </div>
                )}
              </div>

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="max-h-32 overflow-y-auto">
                      {results.errors.slice(0, 10).map((e, i) => (
                        <div key={i} className="text-xs">
                          Row {e.row}: {e.error}
                        </div>
                      ))}
                      {results.errors.length > 10 && (
                        <div className="text-xs mt-1">
                          ...and {results.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
