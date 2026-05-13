
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/useProjectStore'
import type { Project } from '../../store/useProjectStore'
import { getProject } from '../../api/projects'
import { listRFIs } from '../../api/rfi'
import type { RFIRecord } from '../../api/rfi'
import { listCOs, approveCO, rejectCO } from '../../api/changeOrders'
import type { ChangeOrderRecord } from '../../api/changeOrders'
import { listDocuments } from '../../api/documents'
import type { DocumentRecord } from '../../api/documents'
import { listMilestones } from '../../api/milestones'
import type { MilestoneRecord } from '../../api/milestones'
import { listLogs } from '../../api/weeklyLogs'
import type { WeeklyLogRecord } from '../../api/weeklyLogs'
import { listPhotos } from '../../api/photos'
import type { PhotoRecord } from '../../api/photos'

import KPICard from '../../components/ui/KPICard'
import Sparkline from '../../components/charts/Sparkline'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ProjectTeamCard from '../../components/dashboard/ProjectTeamCard'
import type { TeamMemberProfile } from '../../store/useAuthStore'

import SiteRealityFeed from '../../components/dashboard/warroom/SiteRealityFeed'
import OperationalGrid from '../../components/dashboard/warroom/OperationalGrid'
import ContractMilestonesTable from '../../components/dashboard/warroom/ContractMilestonesTable'
import PendingApprovalsSection from '../../components/dashboard/warroom/PendingApprovalsSection'
import AuditTrailCard from '../../components/dashboard/warroom/AuditTrailCard'
import type { AuditEvent } from '../../components/dashboard/warroom/AuditTrailCard'
import FieldPulseFeed from '../../components/dashboard/warroom/FieldPulseFeed'
import EnterpriseGuardCard from '../../components/dashboard/warroom/EnterpriseGuardCard'

import { Zap, Calendar, Activity } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../components/ui/Toast'
import { formatCurrencyAdaptive } from '../../utils/formatters'


interface FullProjectData extends Project {
  team?: { clients: TeamMemberProfile[], agents: TeamMemberProfile[], site_officers: TeamMemberProfile[] };
  recent_activity?: AuditEvent[];
}



export default function AgentWarRoom() {
  const user = useAuthStore(state => state.user)
  const currentProject = useProjectStore(state => state.currentProject)
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [fullProject, setFullProject] = useState<FullProjectData | null>(null)
  const [rfis, setRfis] = useState<RFIRecord[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrderRecord[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([])
  const [logs, setLogs] = useState<WeeklyLogRecord[]>([])
  const [photos, setPhotos] = useState<PhotoRecord[]>([])

  const budgetTotal = parseFloat(currentProject?.budget_total ?? '0') || 0
  const budgetSpent = parseFloat(currentProject?.budget_spent ?? '0') || 0
  const openRfiCount = useMemo(() => rfis.filter(r => r.status === 'OPEN').length, [rfis])
  const pendingCoCount = useMemo(() => changeOrders.filter(c => c.status === 'PENDING').length, [changeOrders])
  const rfiSparkData = useMemo(() => [{ value: 5 }, { value: 4 }, { value: 6 }, { value: openRfiCount }], [openRfiCount])
  const coSparkData = useMemo(() => [{ value: 1 }, { value: 0 }, { value: 2 }, { value: pendingCoCount }], [pendingCoCount])

  const fetchData = useCallback(async () => {
    if (!currentProject) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const id = currentProject.id
      const [projectDetail, rfiData, cos, docs, ms, logData, photoData] = await Promise.all([
        getProject(String(id)).catch(() => null),
        listRFIs(id).catch(() => []),
        listCOs(id).catch(() => []),
        listDocuments(String(id)).catch(() => []),
        listMilestones(id).catch(() => []),
        listLogs(id).catch(() => []),
        listPhotos(String(id)).catch(() => [])
      ])
      setFullProject(projectDetail)
      setRfis(rfiData || [])
      setChangeOrders(cos || [])
      setDocuments((docs || []).filter((d: DocumentRecord) => d.is_current))
      setMilestones(ms || [])
      setLogs(logData || [])
      setPhotos(photoData || [])
    } catch (error) {
      console.error('Failed to load project hub data', error)
      toast('Failed to load live project data. Checking offline queue...', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [currentProject])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApproveCO = async (id: string, token: string) => {
    try {
      await approveCO(id, token)
      toast('Change Order approved.', 'success')
      setChangeOrders(prev => prev.map(co => String(co.id) === String(id) ? { ...co, status: 'APPROVED' } : co))
    } catch (err: unknown) {
      console.error('Failed to approve Change Order:', err)
      toast('Failed to approve Change Order due to network issue.', 'error')
    }
  }

  const handleRejectCO = async (id: string, token: string, reason_code: string = '') => {
    try {
      await rejectCO(id, token, reason_code)
      toast('Change Order officially rejected.', 'success')
      setChangeOrders(prev => prev.map(co => String(co.id) === String(id) ? { ...co, status: 'REJECTED' } : co))
    } catch (err: unknown) {
      console.error('Failed to reject Change Order:', err)
      toast('Failed to reject Change Order.', 'error')
    }
  }


  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState title="No Project Selected" description="Use the project selector in the top bar to switch into the Hub of an active site." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <SkeletonLoader type="card" count={1} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonLoader type="card" count={4} />
        </div>
        <SkeletonLoader type="card" count={1} />
        <SkeletonLoader type="table-row" count={5} />
      </div>
    )
  }

  const completionPercentage = (budgetTotal > 0 ? ((budgetSpent / budgetTotal) * 100).toFixed(1) : '0.0')

  const dailyDelta = '0.00'
  const deltaDirection = 'neutral'
  const deltaDisplay = `${dailyDelta}%`
  const isOfficer = user?.role === 'SITE_OFFICER'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'AGENT'
  const pendingCOs = changeOrders.filter(co => co.status === 'PENDING')

  const originalBudget = budgetTotal
  const approvedCOsTotal = changeOrders
    .filter(co => co.status === 'APPROVED')
    .reduce((sum, co) => sum + parseFloat(String(co.cost_impact)), 0)
  const adjustedBudget = originalBudget + approvedCOsTotal

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-16 scroll-smooth">

      <div className="flex flex-col gap-6 pb-6 border-b border-[var(--color-border-subtle)] mt-4">
        <div className="flex items-start gap-3 sm:gap-5">
          <div className="group relative shrink-0">
            <div className="absolute inset-0 bg-[var(--color-accent-blue)] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-accent-blue)] flex items-center justify-center transform rotate-2 hover:rotate-0 transition-all duration-500 shadow-2xl">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-accent-blue)] fill-[var(--color-accent-blue)]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] truncate">
                {currentProject.name}
              </h1>
              <Badge status={currentProject.status} isActive={currentProject.status === 'ACTIVE'} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-xs sm:text-[13px] text-[var(--color-text-secondary)] font-medium">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] w-fit">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> Project Hub
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[var(--color-accent-emerald)] shrink-0" />
                Project health is optimal
              </span>
            </div>
          </div>
        </div>
        {isOfficer && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[var(--color-bg-elevated)] p-2 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/field')} className="rounded-xl border-[var(--color-border-subtle)]">Field Ops</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/field')} className="rounded-xl shadow-lg shadow-blue-500/10">New Log</Button>
            </div>
          </div>
        )}
      </div>

      <PendingApprovalsSection
        pendingCOs={pendingCOs}
        onApproveCO={handleApproveCO}
        onRejectCO={handleRejectCO}
        onNavigate={navigate}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <KPICard
          title="Project Completion"
          value={`${parseFloat(String(completionPercentage)).toFixed(1)}%`}
          trend={deltaDirection as 'up' | 'down' | 'neutral'}
          trendValue={deltaDisplay}
        >
          <Sparkline
            data={[{ value: 0 }, { value: parseFloat(String(completionPercentage)) }]}
            color="var(--color-accent-cyan)"
          />
        </KPICard>
        <KPICard title="Actual Spend" value={formatCurrencyAdaptive(budgetSpent)} trend="neutral" trendValue="vs Budget">
          <Sparkline data={[{ value: budgetSpent * 0.9 }, { value: budgetSpent }]} color="var(--color-accent-amber)" />
        </KPICard>
        <KPICard title="Projected Buffer" value={formatCurrencyAdaptive(adjustedBudget - budgetSpent)} trend="up" trendValue="Remaining">
          <Sparkline data={rfiSparkData} color="var(--color-accent-emerald)" />
        </KPICard>
        <KPICard title="Pending Risk" value={pendingCoCount} trend={pendingCoCount > 0 ? 'down' : 'neutral'} trendValue="Change Orders">
          <Sparkline data={coSparkData} color="var(--color-accent-red)" />
        </KPICard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        <div className="xl:col-span-8 flex flex-col gap-8">
          <SiteRealityFeed photos={photos} isOfficer={isOfficer} isAdmin={isAdmin} onNavigate={navigate} />
          <OperationalGrid rfis={rfis} changeOrders={changeOrders} documents={documents} onNavigate={navigate} />
          <section className="flex flex-col gap-4">
            <ContractMilestonesTable milestones={milestones} />
          </section>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-8 h-full sticky top-24">
          {fullProject?.team && <ProjectTeamCard team={fullProject.team} />}

          {user?.role !== 'CLIENT' && (
            <>
              <AuditTrailCard events={fullProject?.recent_activity ?? []} />
              <FieldPulseFeed logs={logs} userRole={user?.role ?? ''} onNavigate={navigate} />
            </>
          )}

          <EnterpriseGuardCard />
        </div>
      </div>



    </div>
  )
}
