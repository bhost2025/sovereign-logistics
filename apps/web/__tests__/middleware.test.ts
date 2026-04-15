import { describe, it, expect } from 'vitest'

const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':    ['super_admin', 'director'],
  '/tablero':      ['super_admin', 'operator'],
  '/contenedores': ['super_admin', 'operator'],
  '/clientes':     ['super_admin', 'operator'],
  '/admin':        ['super_admin'],
}

function canAccess(pathname: string, role: string): boolean {
  const allowed = ROUTE_ROLES[pathname]
  if (!allowed) return true
  return allowed.includes(role)
}

describe('RBAC route guard', () => {
  it('director puede acceder a /dashboard', () => {
    expect(canAccess('/dashboard', 'director')).toBe(true)
  })

  it('operator NO puede acceder a /dashboard', () => {
    expect(canAccess('/dashboard', 'operator')).toBe(false)
  })

  it('operator puede acceder a /tablero', () => {
    expect(canAccess('/tablero', 'operator')).toBe(true)
  })

  it('director NO puede acceder a /tablero', () => {
    expect(canAccess('/tablero', 'director')).toBe(false)
  })

  it('solo super_admin puede acceder a /admin', () => {
    expect(canAccess('/admin', 'super_admin')).toBe(true)
    expect(canAccess('/admin', 'operator')).toBe(false)
    expect(canAccess('/admin', 'director')).toBe(false)
  })

  it('rutas no listadas son públicas', () => {
    expect(canAccess('/login', 'operator')).toBe(true)
  })
})
