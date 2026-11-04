import type { Lookups, ReportingAccess, UserRole } from '@/types/api';

/** Mirrors the backend default (business rule 4) so the UI previews what saving will do. */
export function defaultAccess(role: UserRole, designationId: number | null, lookups: Lookups | undefined): ReportingAccess {
  const grants = lookups?.designations.find((d) => d.id === designationId)?.grantsFullAccess ?? false;
  return role === 'learning_team' || role === 'hr' || grants ? 'full' : 'self';
}

const ALL_ROLES: UserRole[] = ['learning_team', 'hr', 'manager', 'team_member'];

/** Roles this person may give others: only the Learning Team can grant Learning Team (mirrors the backend). */
export function assignableRoles(myRole: UserRole): UserRole[] {
  return myRole === 'learning_team' ? ALL_ROLES : ALL_ROLES.filter((r) => r !== 'learning_team');
}

/** HR can manage users, but Learning Team accounts are edited only by the Learning Team. */
export function canEditPerson(myRole: UserRole, targetRole: UserRole): boolean {
  return myRole === 'learning_team' || targetRole !== 'learning_team';
}

export interface PersonDraft {
  role?: UserRole;
  designationId?: number | null;
  lineManagerId?: string | null;
  /** Only present when the admin picked access explicitly. */
  reportingAccess?: ReportingAccess;
}
