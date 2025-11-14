'use client';

import React, { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, addWeeks, getWeek, startOfDay, startOfMonth, addMonths, subMonths, startOfYear, endOfYear, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, CheckSquare, Square, Trash2, Save, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AvailabilityStatus } from '@/lib/types';
import { useCalendarStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DayInfo {
  date: Date;
  dateStr: string;
  status?: AvailabilityStatus;
  eventId?: string;
  note?: string;
  isInitialDay?: boolean;
}

interface WeekInfo {
  number: number;
  start: Date;
  days: DayInfo[];
}

interface DaySelectionModalProps {
  memberId: string;
  memberName: string;
  initialDate: Date;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function DaySelectionModal({ memberId, memberName, initialDate, isOpen, onClose, onUpdate }: DaySelectionModalProps) {
  const { events } = useCalendarStore();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'set-status' | 'delete'>('set-status');
  const [newStatus, setNewStatus] = useState<AvailabilityStatus>('company');
  const [note, setNote] = useState('');

  // États pour le motif récurrent
  const [useRecurring, setUseRecurring] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<number>>(new Set());
  const [recurringStartDate, setRecurringStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurringEndDate, setRecurringEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));

  // État pour la sélection d'année
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const weeks = useMemo<WeekInfo[]>(() => {
    const monthStart = startOfMonth(currentMonth);
    const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: fr });
    
    return Array.from({ length: 4 }, (_, weekIndex) => {
      const weekStart = addWeeks(firstWeekStart, weekIndex);
      const weekNumber = getWeek(weekStart, { weekStartsOn: 1, locale: fr });
      
      const days: DayInfo[] = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(weekStart, dayIndex);
        const targetDate = startOfDay(date);
        const dateStr = format(targetDate, 'yyyy-MM-dd'); // Format stable pour persistence

        const event = events.find((e) => {
          if (e.memberId !== memberId) return false;
          const eventStart = startOfDay(new Date(e.startDate));
          const eventEnd = startOfDay(new Date(e.endDate));
          return targetDate >= eventStart && targetDate <= eventEnd;
        });

        return {
          date,
          dateStr,
          status: event?.status,
          eventId: event?.id,
          note: event?.note,
          isInitialDay: startOfDay(date).getTime() === startOfDay(initialDate).getTime(),
        };
      });
      
      return { number: weekNumber, start: weekStart, days };
    });
  }, [currentMonth, memberId, events, initialDate]);

  const weekSelectionSummary = useMemo(() => {
    return weeks.map(week => ({
      number: week.number,
      count: week.days.filter(d => selectedDays.has(d.dateStr)).length
    })).filter(w => w.count > 0);
  }, [weeks, selectedDays]);

  const toggleDay = (dateStr: string) => {
    const newSet = new Set(selectedDays);
    if (newSet.has(dateStr)) newSet.delete(dateStr);
    else newSet.add(dateStr);
    setSelectedDays(newSet);
  };

  const selectWorkWeek = (week: WeekInfo) => {
    const newSelection = new Set(selectedDays);
    week.days.slice(0, 5).forEach(day => newSelection.add(day.dateStr));
    setSelectedDays(newSelection);
  };

  const selectAll = () => {
    const allDays = weeks.flatMap(w => w.days.map(d => d.dateStr));
    setSelectedDays(new Set(allDays));
  };

  const deselectAll = () => setSelectedDays(new Set());

  const selectYear = () => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const yearDates = allDaysInYear.map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(new Set([...selectedDays, ...yearDates]));
  };

  const toggleWeekday = (dayIndex: number) => {
    const newSet = new Set(selectedWeekdays);
    if (newSet.has(dayIndex)) newSet.delete(dayIndex);
    else newSet.add(dayIndex);
    setSelectedWeekdays(newSet);
  };

  const applyRecurringPattern = () => {
    if (selectedWeekdays.size === 0) {
      alert('Sélectionnez au moins un jour de la semaine');
      return;
    }

    const start = new Date(recurringStartDate);
    const end = new Date(recurringEndDate);

    if (start >= end) {
      alert('La date de début doit être avant la date de fin');
      return;
    }

    const allDays = eachDayOfInterval({ start, end });
    const matchingDays = allDays.filter(date => {
      const dayOfWeek = getDay(date); // 0=dimanche, 1=lundi, etc.
      return selectedWeekdays.has(dayOfWeek);
    });

    const matchingDateStrs = matchingDays.map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(new Set([...selectedDays, ...matchingDateStrs]));
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleApply = async () => {
    if (selectedDays.size === 0) { alert('Sélectionnez au moins un jour'); return; }
    setIsLoading(true);
    try {
      const promises = [];

      for (const dateStr of selectedDays) {
        // Reconstruire la date à partir du format yyyy-MM-dd
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        // Chercher l'événement existant pour cette date
        const targetDate = startOfDay(date);
        const event = events.find((e) => {
          if (e.memberId !== memberId) return false;
          const eventStart = startOfDay(new Date(e.startDate));
          const eventEnd = startOfDay(new Date(e.endDate));
          return targetDate >= eventStart && targetDate <= eventEnd;
        });

        if (actionType === 'delete') {
          if (event?.id) promises.push(fetch(`/api/events/${event.id}`, { method: 'DELETE' }));
        } else {
          if (event?.id) {
            promises.push(fetch(`/api/events/${event.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus, note: note || event.note }),
            }));
          } else {
            promises.push(fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                memberId,
                startDate: date.toISOString(),
                endDate: date.toISOString(),
                status: newStatus,
                note: note || null,
                isImported: false,
              }),
            }));
          }
        }
      }
      
      await Promise.all(promises);
      onUpdate();
      onClose();
    } catch (error) {
      alert('Erreur lors de l\'application');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: AvailabilityStatus) => {
    if (!status) return <Badge variant="outline" className="text-xs">-</Badge>;
    const config = {
      company: { variant: 'info' as const, label: 'Entreprise' },
      available: { variant: 'success' as const, label: 'Dispo' },
      school: { variant: 'purple' as const, label: 'École' },
      unavailable: { variant: 'destructive' as const, label: 'Absent' },
      vacation: { variant: 'orange' as const, label: 'Congé' },
    };
    const c = config[status];
    return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-semibold truncate">Modifier plusieurs jours</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{memberName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="ml-2 flex-shrink-0 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Navigation mois */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 border-b pb-3 sm:pb-4">
            <div className="flex gap-2 order-2 sm:order-1">
              <Button type="button" variant="outline" size="sm" onClick={handlePreviousMonth} disabled={isLoading} className="flex-1 sm:flex-none text-xs sm:text-sm">
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Mois préc.</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleToday} disabled={isLoading} className="flex-1 sm:flex-none text-xs sm:text-sm">
                Aujourd&apos;hui
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleNextMonth} disabled={isLoading} className="flex-1 sm:flex-none text-xs sm:text-sm">
                <span className="hidden sm:inline">Mois suiv.</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
              </Button>
            </div>
            <div className="text-center order-1 sm:order-2">
              <div className="font-semibold text-base sm:text-lg">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</div>
              <div className="text-xs text-gray-500">4 semaines affichées</div>
            </div>
          </div>

          {/* Grille des 4 semaines */}
          <div className="space-y-3 sm:space-y-4">
            {weeks.map(week => {
              const selectedInWeek = week.days.filter(d => selectedDays.has(d.dateStr)).length;
              return (
                <div key={week.number} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-medium text-sm sm:text-base">📅 Semaine {week.number}</span>
                      <span className="text-xs sm:text-sm text-gray-500">{format(week.start, 'd MMM', { locale: fr })} - {format(addDays(week.start, 6), 'd MMM yyyy', { locale: fr })}</span>
                      {selectedInWeek > 0 && <Badge variant="info" className="text-xs w-fit">{selectedInWeek} sélectionné{selectedInWeek > 1 ? 's' : ''}</Badge>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => selectWorkWeek(week)} disabled={isLoading} className="text-xs self-start sm:self-auto">
                      Lun-Ven
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 sm:gap-2">
                    {week.days.map(day => {
                      const isSelected = selectedDays.has(day.dateStr);
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => toggleDay(day.dateStr)}
                          className={cn(
                            'p-2 border-2 rounded-lg transition-all text-center min-h-[80px] sm:min-h-0',
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white',
                            day.isInitialDay && 'ring-2 ring-yellow-400'
                          )}
                        >
                          <div className="flex justify-center mb-1">
                            {isSelected ? <CheckSquare className="h-3 w-3 sm:h-3 sm:w-3 text-blue-600" /> : <Square className="h-3 w-3 sm:h-3 sm:w-3 text-gray-400" />}
                          </div>
                          <div className="text-xs font-medium">{format(day.date, 'EEE', { locale: fr })}</div>
                          <div className="text-sm sm:text-sm font-bold">{format(day.date, 'd')}</div>
                          <div className="mt-1">{getStatusBadge(day.status)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions sélection */}
          <div className="flex flex-col gap-3 border-t pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={isLoading} className="text-xs">
                  Tout (4 sem.)
                </Button>
                <div className="flex items-center gap-1 border rounded-md bg-white flex-1 sm:flex-none">
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} disabled={isLoading} className="px-2 py-1 text-xs sm:text-sm border-0 bg-transparent outline-none">
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <Button type="button" variant="ghost" size="sm" onClick={selectYear} disabled={isLoading} className="font-semibold h-full rounded-l-none text-xs whitespace-nowrap">
                    🗓️ <span className="hidden sm:inline">Année</span>
                  </Button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll} disabled={isLoading} className="text-xs">
                  Réinit.
                </Button>
              </div>
              <div className="text-left sm:text-right">
                <Badge variant="secondary" className="text-xs sm:text-sm">✓ {selectedDays.size} jour{selectedDays.size > 1 ? 's' : ''} sélectionné{selectedDays.size > 1 ? 's' : ''}</Badge>
              </div>
            </div>
            {weekSelectionSummary.length > 0 && (
              <div className="text-xs text-gray-600 space-y-0.5 bg-blue-50 p-2 rounded">
                {weekSelectionSummary.map(w => <div key={w.number}>• Semaine {w.number}: {w.count} jour{w.count > 1 ? 's' : ''}</div>)}
              </div>
            )}
          </div>

          {/* Motif récurrent */}
          <div className="border-t pt-3 sm:pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={useRecurring} onChange={(e) => setUseRecurring(e.target.checked)} disabled={isLoading} className="rounded" />
              <Repeat className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Appliquer un motif récurrent (alternance)</span>
            </label>

            {useRecurring && (
              <div className="ml-0 sm:ml-6 space-y-3 sm:space-y-4 border-l-0 sm:border-l-2 border-purple-200 pl-0 sm:pl-4 bg-purple-50/50 p-3 sm:p-4 rounded-lg sm:rounded-r-lg">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Jours de la semaine</label>
                  <div className="grid grid-cols-4 sm:flex sm:gap-2 gap-2">
                    {[
                      { index: 1, label: 'Lun' },
                      { index: 2, label: 'Mar' },
                      { index: 3, label: 'Mer' },
                      { index: 4, label: 'Jeu' },
                      { index: 5, label: 'Ven' },
                      { index: 6, label: 'Sam' },
                      { index: 0, label: 'Dim' },
                    ].map(day => (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => toggleWeekday(day.index)}
                        disabled={isLoading}
                        className={cn(
                          'px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border-2 transition-all',
                          selectedWeekdays.has(day.index)
                            ? 'border-purple-500 bg-purple-100 text-purple-700'
                            : 'border-gray-300 bg-white hover:border-purple-300'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Date de début</label>
                    <input type="date" value={recurringStartDate} onChange={(e) => setRecurringStartDate(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 text-sm border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Date de fin</label>
                    <input type="date" value={recurringEndDate} onChange={(e) => setRecurringEndDate(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 text-sm border rounded-md" />
                  </div>
                </div>

                <Button type="button" onClick={applyRecurringPattern} disabled={isLoading || selectedWeekdays.size === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
                  <Repeat className="h-4 w-4 mr-2" />
                  Appliquer le motif ({selectedWeekdays.size} jour{selectedWeekdays.size > 1 ? 's' : ''}/semaine)
                </Button>

                <div className="text-xs text-gray-600 bg-purple-100 p-2 rounded">
                  💡 <strong>Exemple :</strong> Sélectionnez &quot;Mar&quot; et &quot;Mer&quot; pour une alternance 2j/semaine
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <h3 className="font-medium text-sm sm:text-base">Action à appliquer</h3>
            <label className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="actionType" value="set-status" checked={actionType === 'set-status'} onChange={() => setActionType('set-status')} disabled={isLoading} className="mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-3 min-w-0">
                <div className="font-medium text-sm sm:text-base">Appliquer un statut</div>
                {actionType === 'set-status' && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Statut</label>
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as AvailabilityStatus)} disabled={isLoading} className="w-full px-3 py-2 text-sm border rounded-md">
                        <option value="company">Entreprise</option>
                        <option value="school">École</option>
                        <option value="available">Disponible</option>
                        <option value="vacation">Vacances</option>
                        <option value="unavailable">Indisponible</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Note (optionnel)</label>
                      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} disabled={isLoading} placeholder="Note commune..." className="w-full px-3 py-2 text-sm border rounded-md" />
                    </div>
                  </>
                )}
              </div>
            </label>
            <label className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="actionType" value="delete" checked={actionType === 'delete'} onChange={() => setActionType('delete')} disabled={isLoading} className="mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-red-600 text-sm sm:text-base">Supprimer les événements</div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Efface les événements des jours sélectionnés</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button type="button" onClick={handleApply} disabled={isLoading || selectedDays.size === 0} className="flex items-center justify-center gap-2 w-full sm:w-auto">
            {actionType === 'delete' ? <><Trash2 className="h-4 w-4" /> Supprimer</> : <><Save className="h-4 w-4" /> Appliquer</>}
            {isLoading && '...'}
          </Button>
        </div>
      </div>
    </div>
  );
}
