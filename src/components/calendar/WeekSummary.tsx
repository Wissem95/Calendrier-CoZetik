'use client'

import { motion } from 'framer-motion'
import { UserCheck, GraduationCap, Users, Calendar } from 'lucide-react'
import { WeekSummary as WeekSummaryType, TeamMember } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface WeekSummaryProps {
  summary: WeekSummaryType
}

interface MemberListProps {
  members: TeamMember[]
  badgeVariant: 'success' | 'info' | 'destructive' | 'warning'
}

const MemberList = ({ members, badgeVariant }: MemberListProps) => {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground italic ml-7">Aucun</p>
  }

  return (
    <div className="space-y-2 ml-7">
      {members.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: member.color }}
          >
            {getInitials(member.name)}
          </div>
          <span className="text-sm font-medium truncate flex-1">{member.name}</span>
          <Badge variant={badgeVariant} className="shrink-0">
            {member.role}
          </Badge>
        </motion.div>
      ))}
    </div>
  )
}

export function WeekSummary({ summary }: WeekSummaryProps) {
  const totalMembers = summary.availableMembers.length + summary.schoolMembers.length + summary.unavailableMembers.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Résumé Semaine {summary.weekNumber}
            </CardTitle>
            <Badge variant="info" className="shrink-0">
              {totalMembers} membre{totalMembers > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Section En entreprise - avec animation stagger */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-700">
                En entreprise ({summary.availableMembers.length})
              </h3>
            </div>
            <MemberList members={summary.availableMembers} badgeVariant="success" />
          </motion.div>

          {/* Section À l'école - avec animation stagger */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-700">
                À l&apos;école ({summary.schoolMembers.length})
              </h3>
            </div>
            <MemberList members={summary.schoolMembers} badgeVariant="info" />
          </motion.div>

          {/* Section Indisponibles - conditionnelle avec animation stagger */}
          {summary.unavailableMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-700">
                  Indisponibles ({summary.unavailableMembers.length})
                </h3>
              </div>
              <MemberList members={summary.unavailableMembers} badgeVariant="destructive" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
