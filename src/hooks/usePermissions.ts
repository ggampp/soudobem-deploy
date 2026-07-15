import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { can, canAny, type Permission, permissionsFor, ROLE_CAPABILITY_SUMMARY } from '../lib/permissions'
import { normalizeRole, type AppRole } from '../lib/roles'

export function usePermissions() {
  const { user } = useApp()
  const role = normalizeRole(user?.role)

  return useMemo(() => {
    const check = (permission: Permission) => can(role, permission)
    return {
      role,
      can: check,
      canAny: (ps: Permission[]) => canAny(role, ps),
      permissions: permissionsFor(role),
      summary:
        role === 'admin'
          ? { can: ['Acesso total'], cannot: [] as string[] }
          : ROLE_CAPABILITY_SUMMARY[role as Exclude<AppRole, 'admin'>],
    }
  }, [role])
}
