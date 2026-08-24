export type MemberRole = 'owner' | 'admin' | 'office_manager' | 'estimator' | 'field_worker'

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner:          'Owner',
  admin:          'Admin',
  office_manager: 'Office Manager',
  estimator:      'Estimador',
  field_worker:   'Técnico / Field Worker',
}

export const ROLE_ORDER: MemberRole[] = ['owner', 'admin', 'office_manager', 'estimator', 'field_worker']

// What each role can do
export const PERMISSIONS = {
  canManageTeam:     (r: MemberRole) => r === 'owner' || r === 'admin',
  canManageFinances: (r: MemberRole) => r === 'owner' || r === 'admin' || r === 'office_manager',
  canCreateQuotes:   (r: MemberRole) => r !== 'field_worker',
  canViewInvoices:   (r: MemberRole) => r !== 'field_worker',
  canSeeAllJobs:     (r: MemberRole) => r !== 'field_worker',
  canApproveChanges: (r: MemberRole) => r === 'owner' || r === 'admin',
}

// Roles that an owner/admin can assign (can't assign owner)
export const ASSIGNABLE_ROLES: MemberRole[] = ['admin', 'office_manager', 'estimator', 'field_worker']
