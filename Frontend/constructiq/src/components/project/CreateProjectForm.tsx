import React, { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Spinner from '../ui/Spinner'
import { toast } from '../ui/Toast'
import { createProject } from '../../api/projects'
import { adminListUsers } from '../../api/users'
import type { AdminUserRecord } from '../../api/users'

interface CreateProjectFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export default function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [budgetTotal, setBudgetTotal] = useState('')

    const [clients, setClients] = useState<AdminUserRecord[]>([])
    const [agents, setAgents] = useState<AdminUserRecord[]>([])
    const [siteOfficers, setSiteOfficers] = useState<AdminUserRecord[]>([])

    const [selectedClients, setSelectedClients] = useState<number[]>([])
    const [selectedAgents, setSelectedAgents] = useState<number[]>([])
    const [selectedSiteOfficers, setSelectedSiteOfficers] = useState<number[]>([])

    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingUsers, setIsFetchingUsers] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
        }, 600)
        return () => clearTimeout(timer)
    }, [])

    const fetchUsers = async () => {
        setIsFetchingUsers(true)
        try {
            const [fetchedClients, fetchedAgents, fetchedOfficers] = await Promise.all([
                adminListUsers('CLIENT'),
                adminListUsers('AGENT'),
                adminListUsers('SITE_OFFICER'),
            ])
            setClients(fetchedClients.filter(u => u.is_active))
            setAgents(fetchedAgents.filter(u => u.is_active))
            setSiteOfficers(fetchedOfficers.filter(u => u.is_active))
        } catch (err) {
            toast('Failed to load user directory.', 'error')
        } finally {
            setIsFetchingUsers(false)
        }
    }

    const toggleSelection = (id: number, type: 'CLIENT' | 'AGENT' | 'SITE_OFFICER') => {
        if (type === 'CLIENT') {
            setSelectedClients(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
        } else if (type === 'AGENT') {
            setSelectedAgents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
        } else if (type === 'SITE_OFFICER') {
            setSelectedSiteOfficers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!name || !budgetTotal) {
            setError('Project Name and Initial Budget are required.')
            return
        }

        setIsLoading(true)
        try {
            const initialMembers = [
                ...selectedClients.map(id => ({ user_id: id, role: 'CLIENT' })),
                ...selectedAgents.map(id => ({ user_id: id, role: 'AGENT' })),
                ...selectedSiteOfficers.map(id => ({ user_id: id, role: 'SITE_OFFICER' }))
            ]

            await createProject({
                name,
                address,
                budget_total: budgetTotal,
                initial_members: initialMembers
            })

            toast('Project created successfully.', 'success')
            onSuccess()
        } catch (err: any) {
            console.error(err)
            const detail = err.response?.data?.detail || 'Failed to create project.'
            setError(detail)
        } finally {
            setIsLoading(false)
        }
    }

    const UserSelectionList = ({
        users,
        selected,
        onToggle,
        label
    }: {
        users: AdminUserRecord[],
        selected: number[],
        onToggle: (id: number) => void,
        label: string
    }) => (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</span>
            <div className="max-h-48 overflow-y-auto border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-bg-interactive)] p-2 flex flex-col gap-1">
                {users.length === 0 ? (
                    <span className="text-xs text-[var(--color-text-muted)] italic p-1">No active {label.toLowerCase()} found.</span>
                ) : (
                    users.map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-[var(--color-bg-surface)] rounded cursor-pointer transition-colors border border-transparent hover:border-[var(--color-border-focus)]">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)]"
                                checked={selected.includes(user.id)}
                                onChange={() => onToggle(user.id)}
                            />
                            <span className="text-sm text-[var(--color-text-primary)] truncate">{user.email}</span>
                        </label>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 h-full">
            <div className="flex flex-col gap-2">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Initialize a new high-integrity construction ledger and assign the initial management team.
                </p>
            </div>

            {error && (
                <div role="alert" className="p-3 bg-red-900/20 border border-red-500/50 rounded-md text-red-500 text-sm animate-pulse">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-6">
                <Input
                    label="Project Name *"
                    placeholder="e.g. Phoenix Tower"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                />
                <Input
                    label="Street Address"
                    placeholder="123 Alpha Avenue, Suite 100"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                />
                <Input
                    label="Authorized Budget *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetTotal}
                    onChange={e => setBudgetTotal(e.target.value)}
                    required
                />
            </div>

            <div className="border-t border-[var(--color-border-subtle)] pt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Core Team Assignments</h3>
                    <span className="text-xs text-[var(--color-text-muted)]">Select multiple personnel per role</span>
                </div>

                {isFetchingUsers ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <UserSelectionList
                            label="Clients / Owners"
                            users={clients}
                            selected={selectedClients}
                            onToggle={(id) => toggleSelection(id, 'CLIENT')}
                        />
                        <UserSelectionList
                            label="Managing Agents"
                            users={agents}
                            selected={selectedAgents}
                            onToggle={(id) => toggleSelection(id, 'AGENT')}
                        />
                        <UserSelectionList
                            label="Site Officers"
                            users={siteOfficers}
                            selected={selectedSiteOfficers}
                            onToggle={(id) => toggleSelection(id, 'SITE_OFFICER')}
                        />
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--color-bg-elevated)] pb-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading || isFetchingUsers} className="min-w-[140px]">
                    {isLoading ? <Spinner size="sm" className="text-white mr-2" /> : null}
                    {isLoading ? 'Establishing...' : 'Establish Project'}
                </Button>
            </div>
        </form>
    )
}
