// Bước kế tiếp thợ được phép chuyển (khớp NEXT_STATUS_BY_WORKER ở backend)
export const NEXT_STEP = {
  MATCHED: { to: "ON_THE_WAY", label: "Bắt đầu di chuyển" },
  ON_THE_WAY: { to: "IN_PROGRESS", label: "Đã đến, bắt đầu sửa" },
  IN_PROGRESS: { to: "COMPLETED", label: "Hoàn thành đơn" },
};
