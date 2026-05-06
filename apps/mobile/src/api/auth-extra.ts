import { api } from './client';

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await api('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res;
}

export async function resetPassword(email: string) {
  const res = await api('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return res;
}
