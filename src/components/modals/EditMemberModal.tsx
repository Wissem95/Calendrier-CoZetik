/**
 * EditMemberModal - Modal for editing existing team members
 *
 * Provides a form to edit team member details including name, role, color, and rotation pattern.
 * Includes a color picker with visual preview and optional delete functionality.
 *
 * @example
 * ```tsx
 * const [member, setMember] = useState<TeamMember | null>(null);
 * const [isOpen, setIsOpen] = useState(false);
 * <EditMemberModal open={isOpen} onOpenChange={setIsOpen} member={member} />
 * ```
 */

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { UserPen, Trash2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCalendarStore } from '@/lib/store';
import { MEMBER_COLORS, TeamMember } from '@/lib/types';

/**
 * EditMemberModal props
 */
export interface EditMemberModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** The member to edit (null when modal is closed) */
  member: TeamMember | null;
}

/**
 * EditMemberModal component
 *
 * Features:
 * - Pre-filled form with current member data
 * - Name and role text inputs with validation
 * - Visual color picker with preview
 * - Rotation pattern editor
 * - Delete member button with confirmation
 * - Auto-sync with store updates
 *
 * @param props - Modal properties
 */
export function EditMemberModal({ open, onOpenChange, member }: EditMemberModalProps) {
  // ========== Store Actions ==========
  const updateMember = useCalendarStore((state) => state.updateMember);
  const removeMember = useCalendarStore((state) => state.removeMember);

  // ========== Form State ==========
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rotationPattern, setRotationPattern] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ========== Initialize form with member data ==========
  useEffect(() => {
    if (member && open) {
      setName(member.name);
      setRole(member.role);
      setRotationPattern(member.rotationPattern);
      setSelectedColor(member.color);
      setIsDeleting(false);
    }
  }, [member, open]);

  /**
   * Handle form submission
   * - Validates name is not empty
   * - Calls updateMember with changes
   * - Closes modal on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name is not empty
    if (!name.trim() || !member) {
      return;
    }

    setIsSaving(true);

    try {
      // Update member in store/API
      await updateMember(member.id, {
        name: name.trim(),
        role: role.trim() || 'Alternant',
        color: selectedColor,
        rotationPattern: rotationPattern.trim(),
      });

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Erreur lors de la mise à jour du membre');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle member deletion
   * - Shows confirmation dialog
   * - Removes member and all their events
   * - Closes modal
   */
  const handleDelete = async () => {
    if (!member) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${member.name} ?\n\nTous les événements associés seront également supprimés.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await removeMember(member.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('Erreur lors de la suppression du membre');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPen className="h-5 w-5 text-primary" />
            Modifier le membre
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du membre de l&apos;équipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Nom complet <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                required
                disabled={isSaving || isDeleting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Rôle / Poste
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Développeur Web"
                disabled={isSaving || isDeleting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Couleur du profil
              </label>
              <div className="flex items-center gap-4">
                {/* Preview Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: selectedColor }}
                >
                  {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AB'}
                </div>

                {/* Color Grid */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {MEMBER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      disabled={isSaving || isDeleting}
                      className={`w-12 h-12 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                        selectedColor === color ? 'ring-4 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Sélectionner la couleur ${color}`}
                    >
                      {selectedColor === color && (
                        <Check className="h-6 w-6 text-white mx-auto" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rotation Pattern Field */}
            <div className="space-y-2">
              <label htmlFor="rotation" className="text-sm font-medium text-foreground">
                Rythme d&apos;alternance
              </label>
              <input
                id="rotation"
                type="text"
                value={rotationPattern}
                onChange={(e) => setRotationPattern(e.target.value)}
                placeholder="Ex: 3 semaines entreprise, 1 semaine école"
                disabled={isSaving || isDeleting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Delete Section */}
            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Suppression...' : 'Supprimer ce membre'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Cette action est irréversible et supprimera tous les événements associés
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSaving || isDeleting}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
