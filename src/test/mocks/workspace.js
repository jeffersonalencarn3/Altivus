export const workspaces = {
  alpha: { id: 'ws-alpha', name: 'Alpha' },
  beta: { id: 'ws-beta', name: 'Beta' },
  blocked: { id: 'ws-blocked', name: 'Blocked', account_status: 'blocked' },
  expired: { id: 'ws-expired', name: 'Expired', account_status: 'expired' },
}

export const memberships = {
  alphaAdmin: {
    id: 'mem-alpha',
    workspace_id: 'ws-alpha',
    user_email: 'ana@altivus.com',
    role: 'workspace_admin',
    status: 'active',
  },
  betaViewer: {
    id: 'mem-beta',
    workspace_id: 'ws-beta',
    user_email: 'ana@altivus.com',
    role: 'visualizador',
    status: 'active',
  },
}

export const users = {
  ana: {
    id: 'user-ana',
    email: 'ana@altivus.com',
    full_name: 'Ana Altivus',
    role: 'user',
  },
  platformAdmin: {
    id: 'user-admin',
    email: 'admin@altivus.com',
    full_name: 'Admin',
    role: 'admin',
  },
}
