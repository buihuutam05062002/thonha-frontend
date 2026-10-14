import { MapPin, Briefcase, Clock, AlertTriangle } from "lucide-react";
import { formatRelative } from "../../../utils/format";

/** Danh sách hồ sơ dạng thẻ: đủ thông tin để admin nhận diện và ưu tiên xử lý. */
export default function PendingTable({ profiles, loading, error, selectedId, onSelect }) {
  if (loading && profiles.length === 0) {
    return (
      <ul className="wa-cards" aria-busy="true">
        {[0, 1, 2, 3].map((i) => <li key={i} className="wa-card wa-skeleton" />)}
      </ul>
    );
  }
  if (error) return <p className="wa-empty wa-error" role="alert">{error}</p>;
  if (profiles.length === 0) return <p className="wa-empty">Không có hồ sơ nào phù hợp</p>;

  return (
    <ul className={`wa-cards ${loading ? "is-loading" : ""}`}>
      {profiles.map((p) => {
        const missing = p.approvalStatus === "PENDING" && p.missingDocuments?.length > 0;
        return (
          <li key={p.id}>
            <button
              type="button"
              className={`wa-card ${p.id === selectedId ? "active" : ""}`}
              onClick={() => onSelect(p.id)}
              aria-current={p.id === selectedId ? "true" : undefined}
            >
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="wa-avatar" />
              ) : (
                <span className="wa-avatar wa-avatar-fallback">{p.fullName?.[0]?.toUpperCase() ?? "?"}</span>
              )}
              <div className="wa-card-body">
                <div className="wa-card-top">
                  <strong className="wa-card-name">{p.fullName}</strong>
                  <span className={`wa-status wa-status-${p.approvalStatus.toLowerCase()}`}>
                    {{ PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" }[p.approvalStatus]}
                  </span>
                </div>
                <div className="wa-chips">
                  {p.specialties.slice(0, 3).map((s) => <span key={s.id} className="wa-chip">{s.name}</span>)}
                  {p.specialties.length > 3 && <span className="wa-chip wa-chip-more">+{p.specialties.length - 3}</span>}
                  {p.specialties.length === 0 && <span className="wa-muted">Chưa chọn chuyên môn</span>}
                </div>
                <div className="wa-meta">
                  <span><MapPin size={12} /> {[p.provinceCity, p.operatingArea].filter(Boolean).join(" | ") || "-"}</span>
                  <span><Briefcase size={12} /> {p.experienceYears ?? 0} năm</span>
                  <span><Clock size={12} /> {formatRelative(p.approvalStatus === "PENDING" ? p.createdAt : p.reviewedAt)}</span>
                </div>
                {missing && (
                  <div className="wa-warn"><AlertTriangle size={12} /> Thiếu CCCD, chưa thể duyệt</div>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
