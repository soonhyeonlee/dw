import { api } from './client';

export async function getCashbackHistory(page = 1, limit = 20) {
  const res = await api(`/cashback/history?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getWithdrawalHistory(page = 1, limit = 20) {
  const res = await api(`/withdrawal/history?page=${page}&limit=${limit}`);
  return res.data;
}

export async function requestWithdrawal(data: {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}) {
  const res = await api('/withdrawal/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}
