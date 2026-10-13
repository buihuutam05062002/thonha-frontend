import axiosClient from "./axiosClient";

/**
 * Phía thợ (quyền WORKER):
 * - GET  /api/v1/worker/wallet
 * - GET  /api/v1/worker/wallet/transactions?page=&size=        (mới nhất trước)
 *
 * Phía admin (quyền ADMIN). {workerId} là id hồ sơ thợ (worker_profile.id), KHÔNG phải id tài khoản:
 * - GET  /api/v1/admin/wallets?keyword=&negativeOnly=&page=&size=
 * - GET  /api/v1/admin/wallets/{workerId}
 * - GET  /api/v1/admin/wallets/{workerId}/transactions?page=&size=
 * - POST /api/v1/admin/wallets/{workerId}/top-up       { amount, referenceCode?, note? }
 * - POST /api/v1/admin/wallets/{workerId}/adjustments  { type: ADJUSTMENT_CREDIT|ADJUSTMENT_DEBIT, amount, reason }
 */

export const TXN_LABELS = {
  TOPUP: "Nạp tiền",
  COMMISSION: "Trừ hoa hồng",
  ADJUSTMENT_CREDIT: "Điều chỉnh tăng",
  ADJUSTMENT_DEBIT: "Điều chỉnh giảm",
};

export const txnLabel = (t) => t.typeLabel || TXN_LABELS[t.type] || t.type;

export const isCredit = (t) => Number(t.amount) >= 0;

export const getMyWallet = () => axiosClient.get("/worker/wallet");

export const getMyWalletTransactions = ({ page = 0, size = 15 } = {}) =>
  axiosClient.get("/worker/wallet/transactions", { params: { page, size } });

export const fetchWallets = ({ keyword, negativeOnly = false, page = 0, size = 8 } = {}) =>
  axiosClient.get("/admin/wallets", {
    params: { keyword: keyword?.trim() || undefined, negativeOnly, page, size },
  });

export const fetchWallet = (workerId) => axiosClient.get(`/admin/wallets/${workerId}`);

export const fetchWalletTransactions = (workerId, { page = 0, size = 10 } = {}) =>
  axiosClient.get(`/admin/wallets/${workerId}/transactions`, { params: { page, size } });

export const topUpWallet = (workerId, { amount, referenceCode, note }) =>
  axiosClient.post(`/admin/wallets/${workerId}/top-up`, {
    amount,
    referenceCode: referenceCode?.trim() || undefined,
    note: note?.trim() || undefined,
  });

export const adjustWallet = (workerId, { type, amount, reason }) =>
  axiosClient.post(`/admin/wallets/${workerId}/adjustments`, { type, amount, reason: reason.trim() });
