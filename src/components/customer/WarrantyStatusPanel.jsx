import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { getMyWarrantyClaims } from "../../api/warrantyApi";
import { useUserTopics } from "../../hooks/useUserTopics";
import { CalendarClock, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { formatDate, formatDateTime, RESOLUTION_LABELS, slotRangeLabel } from "../worker/warranty/warrantyFormat";
import { formatVnd } from "../../utils/format";

const ACCENT = "#F5820D";

const STATUS = {
  PENDING: { label: "Chờ thợ tiếp nhận", bg: "#fff7ed", fg: "#c2410c" },
  PROCESSING: { label: "Đã hẹn lịch", bg: "#eff6ff", fg: "#1d4ed8" },
  COMPLETED: { label: "Đã hoàn tất", bg: "#ecfdf3", fg: "#067647" },
  REJECTED: { label: "Bị từ chối", bg: "#fef3f2", fg: "#b42318" },
};

const EVENTS = [
  "WARRANTY_SCHEDULED",
  "WARRANTY_REJECTED",
  "WARRANTY_COMPLETED",
  "WARRANTY_CLAIM_CREATED",
];

export default function WarrantyStatusPanel({ requestId }) {
  const userId = useAuth().user?.id;
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return getMyWarrantyClaims({ requestId })
      .then((data) => {
        setClaims(data ?? []);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const connected = useUserTopics(userId, ["warranty"], (msg) => {
    if (msg?.requestId && Number(msg.requestId) !== Number(requestId)) return;
    if (EVENTS.includes(msg?.type)) load();
  });
  useEffect(() => {
    if (connected) load();
  }, [connected, load]);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener("warranty:changed", onChanged);
    return () => window.removeEventListener("warranty:changed", onChanged);
  }, [load]);

  if (claims.length === 0 && !error) return null;

  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        <ShieldCheck size={18} color={ACCENT} aria-hidden="true" /> Bảo hành
      </div>
      {error && <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {claims.map((c) => {
          const tone = STATUS[c.status] ?? STATUS.PENDING;
          return (
            <div
              key={c.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <b style={{ fontSize: 14 }}>
                  {c.quotationAmount != null
                    ? `Hạng mục ${formatVnd(c.quotationAmount)}`
                    : "Yêu cầu bảo hành"}
                </b>
                <span
                  style={{
                    background: tone.bg,
                    color: tone.fg,
                    borderRadius: 999,
                    fontSize: 12,
                    padding: "2px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tone.label}
                </span>
              </div>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {c.description}
              </p>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Gửi lúc {formatDateTime(c.createdAt)}
              </div>

              {c.status === "PROCESSING" && c.scheduledAt && (
                <div
                  style={{
                    marginTop: 8,
                    borderRadius: 8,
                    background: "#eff6ff",
                    padding: "8px 10px",
                    fontSize: 13,
                    color: "#1e3a8a",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <CalendarClock size={15} aria-hidden="true" /> Thợ hẹn lịch
                    bảo hành
                  </div>
                  <div style={{ marginTop: 2 }}>
                    {formatDate(c.scheduledAt)} |{" "}
                    {slotRangeLabel(c.scheduledAt)}
                  </div>
                  {c.scheduleNote && (
                    <div style={{ marginTop: 2, whiteSpace: "pre-wrap" }}>
                      Ghi chú: {c.scheduleNote}
                    </div>
                  )}
                </div>
              )}

              {c.status === "REJECTED" && (
                <div
                  style={{
                    marginTop: 8,
                    borderRadius: 8,
                    background: "#fef3f2",
                    padding: "8px 10px",
                    fontSize: 13,
                    color: "#7a1d14",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <XCircle size={15} aria-hidden="true" /> Thợ từ chối bảo
                    hành
                  </div>
                  <div style={{ marginTop: 2, whiteSpace: "pre-wrap" }}>
                    {c.rejectReason}
                  </div>
                </div>
              )}

              {c.status === "COMPLETED" && (
                <div
                  style={{
                    marginTop: 8,
                    borderRadius: 8,
                    background: "#ecfdf3",
                    padding: "8px 10px",
                    fontSize: 13,
                    color: "#054f31",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={15} aria-hidden="true" /> Đã bảo hành
                    xong
                  </div>
                  {c.resolutionType && (
                    <div style={{ marginTop: 2 }}>
                      {RESOLUTION_LABELS[c.resolutionType]}
                    </div>
                  )}
                  {c.resolutionNote && (
                    <div style={{ marginTop: 2, whiteSpace: "pre-wrap" }}>
                      {c.resolutionNote}
                    </div>
                  )}
                  {c.resultImages?.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {c.resultImages.map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={url}
                            alt={`Nghiệm thu ${i + 1}`}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, marginTop: 4, color: "#067647" }}>
                    Hoàn tất lúc {formatDateTime(c.completedAt)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}