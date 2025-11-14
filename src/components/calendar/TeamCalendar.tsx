/**
 * TeamCalendar Component
 *
 * Affiche un calendrier hebdomadaire pour l'équipe avec:
 * - Navigation par semaine (précédent/suivant/aujourd'hui)
 * - Vue en grille: membres en lignes, jours en colonnes
 * - Badges de statut colorés par jour
 * - État vide si aucun membre
 * - Animations fluides
 * - Responsive avec scroll horizontal
 */

'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isToday,
  getWeek,
  getYear,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCalendarStore } from '@/lib/store';
import { AvailabilityStatus, TeamMember } from '@/lib/types';
import { ChevronLeft, ChevronRight, Calendar, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getInitials, cn } from '@/lib/utils';
import { DaySelectionModal } from './DaySelectionModal';
import { EditMemberModal } from '../modals/EditMemberModal';

/**
 * Composant principal du calendrier d'équipe
 */
export function TeamCalendar() {
  // ========== State depuis le store ==========
  const { members, events, selectedWeek, setSelectedWeek, goToToday, getMemberStatus } =
    useCalendarStore();

  // ========== State pour le modal de sélection multiple ==========
  const [selectedDay, setSelectedDay] = useState<{
    memberId: string;
    memberName: string;
    date: Date;
  } | null>(null);

  // ========== State pour le modal d'édition de membre ==========
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditMember, setShowEditMember] = useState(false);

  // ========== Calcul des dates de la semaine ==========
  const weekStart = useMemo(
    () => startOfWeek(selectedWeek, { weekStartsOn: 1, locale: fr }),
    [selectedWeek]
  );

  const weekEnd = useMemo(
    () => endOfWeek(selectedWeek, { weekStartsOn: 1, locale: fr }),
    [selectedWeek]
  );

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: weekEnd,
      }),
    [weekStart, weekEnd]
  );

  const weekNumber = useMemo(
    () => getWeek(weekStart, { weekStartsOn: 1, locale: fr }),
    [weekStart]
  );

  const year = useMemo(() => getYear(weekStart), [weekStart]);

  // ========== Handlers de navigation ==========
  const handlePreviousWeek = () => {
    const prevWeek = subWeeks(selectedWeek, 1);
    setSelectedWeek(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    setSelectedWeek(nextWeek);
  };

  const handleToday = () => {
    goToToday();
  };

  // ========== Handler pour cliquer sur un jour ==========
  const handleEventClick = (memberId: string, date: Date) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setSelectedDay({
      memberId,
      memberName: member.name,
      date,
    });
  };

  // ========== Fonction pour obtenir le badge de statut avec animation pulse pour aujourd'hui ==========
  const getStatusBadge = (memberId: string, date: Date) => {
    const status = getMemberStatus(memberId, date);
    const isDayToday = isToday(date);

    if (!status) {
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-200">
          -
        </Badge>
      );
    }

    // Mapping des statuts vers les variants de Badge
    const statusConfig: Record<
      AvailabilityStatus,
      { variant: 'success' | 'info' | 'destructive' | 'warning' | 'purple' | 'orange'; label: string }
    > = {
      company: { variant: 'info', label: 'Entreprise' },
      available: { variant: 'success', label: 'Dispo' },
      school: { variant: 'purple', label: 'École' },
      unavailable: { variant: 'destructive', label: 'Absent' },
      vacation: { variant: 'orange', label: 'Congé' },
    };

    const config = statusConfig[status];

    // Pulse animation for today's badges
    if (isDayToday) {
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
        </motion.div>
      );
    }

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // ========== État vide: aucun membre avec animation ==========
  if (members.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun membre ajouté</h3>
            <p className="text-muted-foreground">
              Commencez par ajouter des membres à votre équipe pour voir le calendrier.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== Rendu principal ==========
  return (
    <Card className="w-full">
      {/* Header avec navigation */}
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Semaine {weekNumber} - {year}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(weekStart, 'd MMMM', { locale: fr })} -{' '}
              {format(weekEnd, 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>

          {/* Boutons de navigation avec animations */}
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ x: -3 }} transition={{ duration: 0.2 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            <Button variant="outline" onClick={handleToday}>
              Aujourd&apos;hui
            </Button>

            <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                aria-label="Semaine suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </CardHeader>

      {/* Table calendrier avec scroll horizontal */}
      <CardContent>
        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <table className="w-full border-collapse min-w-[800px]">
            {/* Header: jours de la semaine */}
            <thead>
              <tr>
                {/* Colonne vide pour les membres */}
                <th className="sticky left-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 text-left font-semibold border-r border-blue-500">
                  Membre
                </th>

                {/* Colonnes jours */}
                {weekDays.map((day) => {
                  const isDayToday = isToday(day);
                  return (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        'bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 text-center font-semibold min-w-[120px] border-r border-blue-500',
                        isDayToday && 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs uppercase">
                          {format(day, 'EEE', { locale: fr })}
                        </span>
                        <span className="text-lg font-bold">
                          {format(day, 'd', { locale: fr })}
                        </span>
                        <span className="text-xs">
                          {format(day, 'MMM', { locale: fr })}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body: lignes membres avec stagger animation */}
            <tbody>
              {members.map((member, index) => (
                <motion.tr
                  key={member.id}
                  className="border-b hover:bg-accent/50 hover:scale-[1.01] transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {/* Colonne membre (sticky) */}
                  <td className="sticky left-0 z-10 bg-card p-4 border-r">
                    <div className="flex items-center gap-3">
                      {/* Avatar avec initiales - Cliquable pour éditer */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(member);
                          setShowEditMember(true);
                        }}
                        className="relative group"
                        aria-label={`Modifier ${member.name}`}
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2"
                          style={{ backgroundColor: member.color }}
                        >
                          {getInitials(member.name)}
                        </div>
                        {/* Icône crayon qui apparaît au hover */}
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 className="h-4 w-4 text-white" />
                        </div>
                      </button>

                      {/* Nom + rôle */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{member.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Colonnes statuts par jour */}
                  {weekDays.map((day) => {
                    const isDayToday = isToday(day);
                    return (
                      <td
                        key={day.toISOString()}
                        className={cn(
                          'px-4 py-8 text-center border-r cursor-pointer hover:bg-gray-50 transition-colors',
                          isDayToday && 'bg-yellow-50'
                        )}
                        onClick={() => handleEventClick(member.id, day)}
                        title="Cliquer pour éditer"
                      >
                        {getStatusBadge(member.id, day)}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </CardContent>

      {/* Modal de sélection multiple de jours */}
      {selectedDay && (
        <DaySelectionModal
          memberId={selectedDay.memberId}
          memberName={selectedDay.memberName}
          initialDate={selectedDay.date}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          onUpdate={() => {
            setSelectedDay(null);
            // Force re-render to refresh data
            window.location.reload();
          }}
        />
      )}

      {/* Modal d'édition de membre */}
      <EditMemberModal
        open={showEditMember}
        onOpenChange={setShowEditMember}
        member={editingMember}
      />
    </Card>
  );
}
