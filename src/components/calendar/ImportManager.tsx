/**
 * ImportManager Component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCalendarStore } from '@/lib/store';

interface Import {
  id: string;
  member_id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  upload_date: string;
  eventsCount?: number;
}

export function ImportManager() {
  const { members } = useCalendarStore();
  const [imports, setImports] = useState<Import[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const allImports: Import[] = [];
      for (const member of members) {
        const response = await fetch(`/api/import/${member.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.imports?.length > 0) allImports.push(...data.imports);
        }
      }
      setImports(allImports);
    } catch (error) {
      console.error('Error fetching imports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (members.length > 0) fetchImports();
    else setIsLoading(false);
  }, [members]);

  const handleDelete = async (importItem: Import) => {
    if (!confirm(`Supprimer "${importItem.file_name}" et ses ${importItem.eventsCount || 0} événements ?`)) return;
    setDeletingId(importItem.id);
    try {
      const response = await fetch(`/api/import/${importItem.member_id}?fileName=${encodeURIComponent(importItem.file_name)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      await fetchImports();
      window.location.reload();
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getMemberName = (memberId: string) => members.find(m => m.id === memberId)?.name || 'Inconnu';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  if (imports.length === 0) {
    return (
      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Imports de calendriers</h3></CardHeader>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun calendrier importé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold">Imports de calendriers</h3>
        <Button variant="outline" size="sm" onClick={fetchImports} className="w-full sm:w-auto text-xs sm:text-sm">
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-3">
          {imports.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm sm:text-base">{item.file_name}</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                    <span className="truncate">{getMemberName(item.member_id)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{format(new Date(item.upload_date), 'dd MMM yyyy', { locale: fr })}</span>
                    {item.eventsCount !== undefined && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <Badge variant="outline" className="text-xs">{item.eventsCount} événements</Badge>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs sm:text-sm flex-shrink-0">{item.file_type.toUpperCase()}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                className="text-red-600 hover:bg-red-50 self-end sm:self-auto w-full sm:w-auto"
              >
                {deletingId === item.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="ml-2 sm:hidden">Supprimer</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
