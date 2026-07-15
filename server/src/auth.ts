import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from './env.js'

export type AuthPayload = { userId: string; email: string }

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '14d' })
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }
  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    ;(req as Request & { auth: AuthPayload }).auth = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function getAuth(req: Request): AuthPayload {
  return (req as Request & { auth: AuthPayload }).auth
}

export function requireRoles(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    try {
      const { query } = await import('./db.js')
      const { normalizeRole } = await import('./roles.js')
      const u = await query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [auth.userId])
      if (!u.rowCount) {
        res.status(401).json({ error: 'Usuário não encontrado' })
        return
      }
      const role = normalizeRole(u.rows[0].role)
      if (role === 'admin' || roles.includes(role)) {
        next()
        return
      }
      res.status(403).json({ error: `Perfil "${role}" sem permissão. Requer: ${roles.join(', ')}` })
    } catch (e) {
      res.status(500).json({ error: String(e) })
    }
  }
}

/** Exige uma permissão da matriz por perfil */
export function requirePermission(...permissions: import('./permissions.js').Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    try {
      const { query } = await import('./db.js')
      const { normalizeRole } = await import('./roles.js')
      const { can, denyMessage } = await import('./permissions.js')
      const u = await query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [auth.userId])
      if (!u.rowCount) {
        res.status(401).json({ error: 'Usuário não encontrado' })
        return
      }
      const role = normalizeRole(u.rows[0].role)
      const ok = permissions.some((p) => can(role, p))
      if (ok) {
        next()
        return
      }
      res.status(403).json({
        error: denyMessage(role, permissions[0]),
        required: permissions,
        role,
      })
    } catch (e) {
      res.status(500).json({ error: String(e) })
    }
  }
}

export async function getUserRole(userId: string) {
  const { query } = await import('./db.js')
  const { normalizeRole } = await import('./roles.js')
  const u = await query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [userId])
  return normalizeRole(u.rows[0]?.role)
}
