/**
 * Calendar Upload Component
 *
 * Provides drag & drop interface for uploading calendar files (.ics, .xlsx, .xls, .csv).
 * Parses uploaded files, displays results, and imports events into the store.
 *
 * @example
 * ```tsx
 * <CalendarUpload
 *   member={member}
 *   onSuccess={() => console.log('Calendar uploaded!')}
 * />
 * ```
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';
import { loadInitialData } from '@/lib/store';

/**
 * Props for CalendarUpload component
 */
export interface CalendarUploadProps {
  /**
   * The team member whose calendar will be uploaded
   */
  member: TeamMember;

  /**
   * Optional callback invoked after successful upload and import
   * Called 2 seconds after successful import to allow user to see success message
   */
  onSuccess?: () => void;
}

/**
 * Result of the upload operation
 */
interface UploadResult {
  success: boolean;
  message: string;
  eventsCount?: number;
}

/**
 * CalendarUpload Component
 *
 * Features:
 * - Drag & drop interface with visual feedback
 * - Supports ICS, Excel (.xlsx, .xls), and CSV files
 * - Real-time parsing and validation
 * - Success/error messages with icons
 * - Loading state during processing
 * - Automatic store integration
 * - Format badges for supported file types
 * - Helpful tips for users
 *
 * @param props - Component properties
 */
export function CalendarUpload({ member, onSuccess }: CalendarUploadProps) {
  // ========== State Management ==========

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // ========== File Drop Handler ==========

  /**
   * Handle dropped files
   * Uploads file to API, which parses and saves to Supabase
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Ensure we have a file
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Reset state
      setIsUploading(true);
      setUploadResult(null);

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('memberId', member.id);
        formData.append('file', file);

        // Upload to API
        const response = await fetch('/api/import', {
          method: 'POST',
          body: formData, // Don't set Content-Type header - browser will set it with boundary
        });

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          // API returned error
          throw new Error(data.error || data.details || 'Échec de l\'upload');
        }

        // Success - reload data from API to sync store
        await loadInitialData();

        // Show success message
        setUploadResult({
          success: true,
          message: `${data.eventsCreated || 0} événement(s) importé(s) avec succès !`,
          eventsCount: data.eventsCreated || 0,
        });

        // Call onSuccess callback after 2 seconds
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } catch (error) {
        // Handle errors
        console.error('Upload error:', error);
        setUploadResult({
          success: false,
          message: `Erreur lors de l'upload: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [member.id, onSuccess]
  );

  // ========== Dropzone Configuration ==========

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/calendar': ['.ics'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  // ========== Render ==========

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer le calendrier annuel</CardTitle>
        <CardDescription>
          Uploadez le calendrier fourni par HETIC pour {member.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dropzone Area with scale pulse on drag */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200',
            'flex flex-col items-center justify-center gap-3 min-h-[200px]',
            isDragActive
              ? 'border-primary bg-primary/5 scale-105'
              : 'border-muted hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <input {...getInputProps()} />

          {/* Loading State */}
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">
                Traitement du fichier en cours...
              </p>
            </>
          ) : (
            <>
              {/* Default State */}
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragActive
                    ? 'Déposez le fichier ici'
                    : 'Glissez-déposez un fichier ici'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou cliquez pour parcourir vos fichiers
                </p>
              </div>
            </>
          )}
        </div>

        {/* Upload Result Message with slide-in animation */}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg transition-all',
              uploadResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            )}
          >
            {uploadResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <p
              className={cn(
                'text-sm font-medium',
                uploadResult.success ? 'text-green-800' : 'text-red-800'
              )}
            >
              {uploadResult.message}
            </p>
          </motion.div>
        )}

        {/* Supported Formats */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Formats supportés :
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">.ics</Badge>
            <Badge variant="secondary">.xlsx</Badge>
            <Badge variant="secondary">.xls</Badge>
            <Badge variant="secondary">.csv</Badge>
            <Badge variant="secondary">.pdf</Badge>
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Astuce :</span> Téléchargez le
            calendrier officiel fourni par HETIC (ICS, Excel, CSV ou PDF).
            Les PDFs sont analysés automatiquement pour détecter les périodes
            &ldquo;école&rdquo; et &ldquo;entreprise&rdquo;. Format Excel/CSV: colonnes <strong>Date début</strong>,{' '}
            <strong>Date fin</strong>, <strong>Type</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
