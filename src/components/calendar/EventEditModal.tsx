/**
 * EventEditModal Component
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AvailabilityStatus } from '@/lib/types';

interface EventEditModalProps {
  event: {
    id: string;
    memberId: string;
    startDate: Date;
    endDate: Date;
    status: AvailabilityStatus;
    note?: string;
  };
  memberName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EventEditModal({ event, memberName, isOpen, onClose, onUpdate }: EventEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: format(event.startDate, 'yyyy-MM-dd'),
    endDate: format(event.endDate, 'yyyy-MM-dd'),
    status: event.status,
    note: event.note || '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: formData.status,
          note: formData.note,
        }),
      });
      if (!response.ok) throw new Error('Update failed');
      onUpdate();
      onClose();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      onUpdate();
      onClose();
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Modifier événement</h2>
          <button onClick={onClose} disabled={isLoading}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Membre</label>
            <input type="text" value={memberName} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as AvailabilityStatus})} disabled={isLoading} className="w-full px-3 py-2 border rounded-md">
              <option value="available">Disponible</option>
              <option value="school">École</option>
              <option value="vacation">Vacances</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} rows={3} disabled={isLoading} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="flex justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
              <Button type="submit" disabled={isLoading}><Save className="h-4 w-4 mr-2" />{isLoading ? 'En cours...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
