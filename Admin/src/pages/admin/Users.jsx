import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Users as UsersIcon, Search, Building2, UserPlus } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextInput } from '../../components/Field'
import { listUsers, createStaffUser, updateUserStatus, updateUserRole, assignUserWorkshop } from '../../services/adminApi'
import { listWorkshops } from '../../services/workshopApi'
import { USER_ROLES, USER_STATUSES, formatDateTime } from '../../utils/transitions'
import { useAuth } from '../../contexts/authContext.js'
import {
  ACCENT,
  ACCENT_HOVER,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  PANEL_ACTIVE,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../../config/theme'

const ROLE_FILTERS = ['ALL', ...USER_ROLES]
const STATUS_FILTERS = ['ALL', ...USER_STATUSES]
const WORKSHOP_ROLES = ['WORKSHOP_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC']
const STAFF_ROLES = ['WORKSHOP_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC']
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const EMPTY_STAFF_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  role: '',
  workshopId: '',
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)

  const [statusTarget, setStatusTarget] = useState(null)
  const [statusValue, setStatusValue] = useState('')
  const [roleTarget, setRoleTarget] = useState(null)
  const [roleValue, setRoleValue] = useState('')
  const [workshopTarget, setWorkshopTarget] = useState(null)
  const [workshopValue, setWorkshopValue] = useState('')
  const [workshops, setWorkshops] = useState([])
  const [workshopsLoading, setWorkshopsLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [staffOpen, setStaffOpen] = useState(false)
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM)
  const [creating, setCreating] = useState(false)

  const buildParams = () => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (role !== 'ALL') params.role = role
    if (status !== 'ALL') params.status = status
    if (search.trim()) params.search = search.trim()
    return params
  }

  const reload = async () => {
    try {
      const res = await listUsers(buildParams())
      setUsers(res.data?.users || [])
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (role !== 'ALL') params.role = role
    if (status !== 'ALL') params.status = status
    if (search.trim()) params.search = search.trim()
    let cancelled = false
    listUsers(params)
      .then((res) => {
        if (!cancelled) {
          setUsers(res.data?.users || [])
          setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
        }
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, role, status, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
    setLoading(true)
  }

  const openStatus = (u) => {
    setStatusTarget(u)
    setStatusValue(u.status)
  }

  const openRole = (u) => {
    setRoleTarget(u)
    setRoleValue(u.role)
  }

  const openWorkshop = async (u) => {
    setWorkshopTarget(u)
    setWorkshopValue(u.workshopId?._id || u.workshopId || 'none')
    setWorkshopsLoading(true)
    try {
      const res = await listWorkshops({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
      setWorkshops(res.data?.workshops || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkshopsLoading(false)
    }
  }

  const handleWorkshop = async () => {
    setUpdating(true)
    try {
      await assignUserWorkshop(workshopTarget._id, {
        workshopId: workshopValue === 'none' ? null : workshopValue,
      })
      toast.success('User workshop updated')
      setWorkshopTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleStatus = async () => {
    setUpdating(true)
    try {
      await updateUserStatus(statusTarget._id, { status: statusValue })
      toast.success('User status updated')
      setStatusTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleRole = async () => {
    setUpdating(true)
    try {
      await updateUserRole(roleTarget._id, { role: roleValue })
      toast.success('User role updated')
      setRoleTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const openStaff = async () => {
    setStaffForm(EMPTY_STAFF_FORM)
    setStaffOpen(true)
    setWorkshopsLoading(true)
    try {
      const res = await listWorkshops({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
      setWorkshops(res.data?.workshops || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkshopsLoading(false)
    }
  }

  const updateStaffField = (key) => (e) => {
    setStaffForm((s) => ({ ...s, [key]: e.target.value }))
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!staffForm.name?.trim() || !staffForm.email?.trim() || !staffForm.phone?.trim() || !staffForm.role) {
      toast.error('Name, email, phone and role are required')
      return
    }
    setCreating(true)
    try {
      await createStaffUser({
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone,
        password: staffForm.password,
        gender: staffForm.gender || 'other',
        role: staffForm.role,
        workshopId: staffForm.workshopId || null,
      })
      toast.success(`${staffForm.role.replace(/_/g, ' ')} created`)
      setStaffOpen(false)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <UsersIcon size={22} style={{ color: ACCENT }} />
                <h1
                  className="text-3xl font-black uppercase tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Users
                </h1>
              </div>
              <p className="text-sm" style={{ color: MUTED }}>
                {pagination.total} registered users
              </p>
            </div>
            <button
              type="button"
              onClick={openStaff}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <UserPlus size={15} />
              Add Staff
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email or phone..."
                className="w-full py-3 pl-10 pr-4 text-sm outline-none transition-colors duration-200"
                style={{ background: PANEL, border: `1px solid ${LINE_STRONG}`, color: FOREGROUND }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest mr-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
              Role:
            </span>
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setPage(1) }}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.1em',
                  border: `1px solid ${role === r ? ACCENT : LINE_STRONG}`,
                  color: role === r ? '#fff' : MUTED,
                  background: role === r ? ACCENT : 'transparent',
                }}
              >
                {r.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest mr-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
              Status:
            </span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setPage(1) }}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.1em',
                  border: `1px solid ${status === s ? ACCENT : LINE_STRONG}`,
                  color: status === s ? '#fff' : MUTED,
                  background: status === s ? ACCENT : 'transparent',
                }}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" message="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['User', 'Contact', 'Role', 'Workshop', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {u.name}
                      </span>
                      {u._id === currentUser?._id && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest" style={{ color: ACCENT }}>You</span>
                      )}
                      <p className="text-xs" style={{ color: MUTED }}>{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {u.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {WORKSHOP_ROLES.includes(u.role) ? (
                        u.workshopId?.name
                          ? <span style={{ color: FOREGROUND }}>{u.workshopId.name}<span className="text-xs" style={{ color: MUTED }}> · {u.workshopId.code}</span></span>
                          : '—'
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openStatus(u)}
                          disabled={u._id === currentUser?._id || u.role === 'ADMIN'}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          Status
                        </button>
                        <button
                          type="button"
                          onClick={() => openRole(u)}
                          disabled={u._id === currentUser?._id}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          Role
                        </button>
                        {WORKSHOP_ROLES.includes(u.role) && (
                          <button
                            type="button"
                            onClick={() => openWorkshop(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                            style={ghostButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                          >
                            <Building2 size={11} />
                            Workshop
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={ghostButtonStyle}
            >
              Prev
            </button>
            <span className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={ghostButtonStyle}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={`Status · ${statusTarget?.name || ''}`}
      >
        <SelectInput
          label="User Status"
          required
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
        >
          {USER_STATUSES.map((s) => (
            <option key={s} value={s} style={{ background: PANEL }}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectInput>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setStatusTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStatus}
            disabled={updating}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title={`Role · ${roleTarget?.name || ''}`}
      >
        <SelectInput
          label="User Role"
          required
          value={roleValue}
          onChange={(e) => setRoleValue(e.target.value)}
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r} style={{ background: PANEL }}>
              {r.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectInput>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setRoleTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRole}
            disabled={updating}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!workshopTarget}
        onClose={() => setWorkshopTarget(null)}
        title={`Posting · ${workshopTarget?.name || ''}`}
      >
        <SelectInput
          label="Assigned Workshop"
          value={workshopValue}
          onChange={(e) => setWorkshopValue(e.target.value)}
        >
          <option value="none" style={{ background: PANEL }}>Not assigned</option>
          {workshopsLoading ? (
            <option disabled style={{ background: PANEL }}>Loading workshops…</option>
          ) : (
            workshops.map((w) => (
              <option key={w._id} value={w._id} style={{ background: PANEL }}>
                {w.name}
                {w.address?.city ? ` · ${w.address.city}` : ''}
              </option>
            ))
          )}
        </SelectInput>
        <p className="text-xs mt-2" style={{ color: MUTED }}>
          Where is this {workshopTarget?.role?.replace(/_/g, ' ')} posted? This scopes their work to one workshop.
        </p>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setWorkshopTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleWorkshop}
            disabled={updating}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Posting'}
          </button>
        </div>
      </Modal>

      <Modal
        open={staffOpen}
        onClose={() => setStaffOpen(false)}
        title="Add Staff User"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4" noValidate>
          <p className="text-sm" style={{ color: MUTED }}>
            Staff accounts are created only by an admin. Staff cannot self-register.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              required
              value={staffForm.name}
              onChange={updateStaffField('name')}
              placeholder="Ravi Kumar"
            />
            <TextInput
              label="Email"
              type="email"
              required
              value={staffForm.email}
              onChange={updateStaffField('email')}
              placeholder="ravi@kromdetail.com"
            />
            <TextInput
              label="Phone"
              type="tel"
              required
              value={staffForm.phone}
              onChange={updateStaffField('phone')}
              placeholder="9876500000"
            />
            <div>
              <TextInput
                label="Password"
                type="password"
                required
                value={staffForm.password}
                onChange={updateStaffField('password')}
                placeholder="Min 8 chars with a symbol"
              />
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                At least 8 chars · 1 uppercase · 1 lowercase · 1 number · 1 symbol
              </p>
            </div>
            <SelectInput
              label="Gender"
              value={staffForm.gender}
              onChange={updateStaffField('gender')}
              placeholder="Select gender"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ background: PANEL }}>
                  {opt.label}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="Role"
              required
              value={staffForm.role}
              onChange={updateStaffField('role')}
              placeholder="Select staff role"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r} style={{ background: PANEL }}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </SelectInput>
            <div className="sm:col-span-2">
              <SelectInput
                label="Assigned Workshop"
                value={staffForm.workshopId}
                onChange={updateStaffField('workshopId')}
                placeholder="Not assigned yet"
              >
                {workshopsLoading ? (
                  <option disabled style={{ background: PANEL }}>Loading workshops…</option>
                ) : (
                  workshops.map((w) => (
                    <option key={w._id} value={w._id} style={{ background: PANEL }}>
                      {w.name}
                      {w.address?.city ? ` · ${w.address.city}` : ''}
                    </option>
                  ))
                )}
              </SelectInput>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStaffOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              {creating ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}