import { describe, expect, it } from 'vitest';
import { assignableRoles, canEditPerson } from './access';

describe('user management access (mirrors the backend)', () => {
  it('lets only the Learning Team offer the Learning Team role', () => {
    expect(assignableRoles('learning_team')).toContain('learning_team');
    expect(assignableRoles('hr')).toEqual(['hr', 'manager', 'team_member']);
  });

  it('locks Learning Team accounts for HR', () => {
    expect(canEditPerson('hr', 'learning_team')).toBe(false);
    expect(canEditPerson('hr', 'manager')).toBe(true);
    expect(canEditPerson('learning_team', 'learning_team')).toBe(true);
  });
});
