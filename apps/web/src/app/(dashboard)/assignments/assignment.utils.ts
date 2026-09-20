import type { GuardAssignment } from '@segapp/contracts';

export type AssignmentStatus = 'scheduled' | 'active' | 'finished';

export function formatAssignmentDate(value: string): string {
  return new Date(value).toLocaleString('es-MX');
}

export function getAssignmentStatus(
  assignment: GuardAssignment,
  currentTimestamp: number,
): AssignmentStatus {
  if (assignment.endedAt) {
    return 'finished';
  }

  if (new Date(assignment.startedAt).getTime() > currentTimestamp) {
    return 'scheduled';
  }

  return 'active';
}

export function getAssignmentStatusLabel(status: AssignmentStatus): string {
  const labels: Record<AssignmentStatus, string> = {
    scheduled: 'Programada',
    active: 'Vigente',
    finished: 'Finalizada',
  };

  return labels[status];
}

export function getAssignmentStatusTone(
  status: AssignmentStatus,
): 'info' | 'ok' | 'warn' {
  const tones: Record<AssignmentStatus, 'info' | 'ok' | 'warn'> = {
    scheduled: 'info',
    active: 'ok',
    finished: 'warn',
  };

  return tones[status];
}

export function isFutureDate(value: Date): boolean {
  return value.getTime() > Date.now();
}

export function getCurrentTimestamp(): number {
  return Date.now();
}
