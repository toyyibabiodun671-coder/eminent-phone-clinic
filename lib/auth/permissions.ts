export type UserRole = 'admin' | 'apprentice'

export const permissions = {
  admin: {
    dashboard: true,
    sales: true,
    repairs: true,
    customers: true,
    devices: true,
    technicians: true,
    apprentices: true,
    reports: true,
    safeBox: true,
    settings: true,
  },

  apprentice: {
    dashboard: true,
    sales: false,
    repairs: true,
    customers: true,
    devices: true,
    technicians: false,
    apprentices: false,
    reports: false,
    safeBox: false,
    settings: false,
  },
} satisfies Record<UserRole, Record<string, boolean>>