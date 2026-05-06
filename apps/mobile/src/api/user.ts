import { api } from './client';

export async function updateProfile(data: {
  nickname?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}) {
  const res = await api('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}
