'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Plus, Upload, AlertCircle, Loader2, Edit2 } from 'lucide-react'
import { TeamCalendar } from '@/components/calendar/TeamCalendar'
import { WeekSummary } from '@/components/calendar/WeekSummary'
import { ImportManager } from '@/components/calendar/ImportManager'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AddMemberModal } from '@/components/modals/AddMemberModal'
import { AddEventModal } from '@/components/modals/AddEventModal'
import { EditMemberModal } from '@/components/modals/EditMemberModal'
import { CalendarUpload } from '@/components/calendar/CalendarUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/Dialog'
import { useCalendarStore, loadInitialData } from '@/lib/store'
import { useRealtimeSync } from '@/lib/supabase/realtime'
import { cn } from '@/lib/utils'
import { TeamMember } from '@/lib/types'

export default function Home() {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Activate realtime synchronization (runs only when data is loaded)
  useRealtimeSync(!isLoading && !loadError)

  // Modal states
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showImportCalendar, setShowImportCalendar] = useState(false)
  const [showEditMember, setShowEditMember] = useState(false)
  const [selectedMemberForImport, setSelectedMemberForImport] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  const getWeekSummary = useCalendarStore((state) => state.getWeekSummary)
  const selectedWeek = useCalendarStore((state) => state.selectedWeek)
  const members = useCalendarStore((state) => state.members)
  const events = useCalendarStore((state) => state.events)

  // Load initial data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        await loadInitialData()
      } catch (error) {
        console.error('Failed to load initial data:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Memoize summary calculation to avoid recalculation on every render
  // Dependencies: getWeekSummary, selectedWeek
  // getWeekSummary internally accesses members and events from the store
  const summary = useMemo(() => getWeekSummary(selectedWeek), [getWeekSummary, selectedWeek])

  // Calculate selected member for import modal
  const selectedMember = members.find(m => m.id === selectedMemberForImport)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Erreur de chargement</h2>
          </div>
          <p className="text-gray-700 mb-4">{loadError}</p>
          <p className="text-sm text-gray-500 mb-4">
            Vérifiez que Supabase est correctement configuré dans .env.local
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Réessayer
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left section: Logo + Titles */}
            <div className="flex items-center gap-3">
              {/* Logo with gradient */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>

              {/* Titles */}
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground">
                  Team Calendar
                </h1>
                <p className="text-xs text-gray-500">
                  Planning d&apos;équipe collaboratif
                </p>
              </div>
            </div>

            {/* Right section: Members badge */}
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 w-fit">
              <Users className="w-3.5 h-3.5" />
              <span>{members.length} membre{members.length !== 1 ? 's' : ''}</span>
            </Badge>
          </div>
        </motion.div>
      </header>

      {/* Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <Button
            variant="primary"
            onClick={() => setShowAddMember(true)}
            className="shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Ajouter un membre
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAddEvent(true)}
            disabled={members.length === 0}
          >
            <Plus className="w-4 h-4" />
            Ajouter une période
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowImportCalendar(true)}
            disabled={members.length === 0}
          >
            <Upload className="w-4 h-4" />
            Importer un calendrier
          </Button>
        </motion.div>
      </div>

      {/* Content - Animated with stagger delay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-6"
      >
        {/* Calendrier */}
        <TeamCalendar />

        {/* Gestionnaire d'imports */}
        {members.length > 0 && <ImportManager />}

        {/* Résumé hebdomadaire - only show if members exist */}
        {members.length > 0 && <WeekSummary summary={summary} />}
      </motion.div>

      {/* Footer - Fade in with delay */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mt-12 py-6 text-center border-t"
      >
        <p className="text-sm text-gray-500">
          Made with ❤️ for CoZetic
        </p>
      </motion.footer>

      {/* Modals */}
      <AddMemberModal open={showAddMember} onOpenChange={setShowAddMember} />
      <AddEventModal open={showAddEvent} onOpenChange={setShowAddEvent} />
      <EditMemberModal
        open={showEditMember}
        onOpenChange={setShowEditMember}
        member={editingMember}
      />

      {/* Import Calendar Modal */}
      <Dialog
        open={showImportCalendar}
        onOpenChange={(open) => {
          setShowImportCalendar(open)
          if (!open) setSelectedMemberForImport(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <DialogTitle>Importer un calendrier annuel</DialogTitle>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {/* Member Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Sélectionner un membre
              </label>
              <div className="space-y-2">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForImport(member.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all hover:scale-[1.02]',
                        selectedMemberForImport === member.id
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-foreground">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </button>
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMember(member);
                        setShowEditMember(true);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                      aria-label="Modifier ce membre"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Calendar Upload - appears when member selected */}
            {selectedMember && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CalendarUpload
                  member={selectedMember}
                  onSuccess={() => {
                    setTimeout(() => {
                      setShowImportCalendar(false)
                      setSelectedMemberForImport(null)
                    }, 2000)
                  }}
                />
              </motion.div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </main>
  )
}
