import { MapPin, Briefcase, Clock, AlertTriangle } from "lucide-react";
import { formatRelative } from "../../../utils/format";
import { Avatar, Chip, Empty, ListCard, ListCardSkeleton, ListCards, StatusBadge } from "../../../components/admin/ui";

export const STATUS_TEXT = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Đã từ chối" };
export const STATUS_TONE = { PENDING: "pending", APPROVED: "success", REJECTED: "danger" };

const META = "inline-flex items-center gap-1";

/** Danh sách hồ sơ dạng thẻ: đủ thông tin để admin nhận diện và ưu tiên xử lý. */
export default function PendingTable({ profiles, loading, error, selectedId, onSelect }) {
  if (loading && profiles.length === 0) return <ListCardSkeleton />;
  if (error) return <Empty error>{error}</Empty>;
  if (profiles.length === 0) return <Empty>Không có hồ sơ nào phù hợp</Empty>;

  return (
    <ListCards loading={loading}>
      {profiles.map((p) => {
        const missing = p.approvalStatus === "PENDING" && p.missingDocuments?.length > 0;
        return (
          <ListCard key={p.id} active={p.id === selectedId} onClick={() => onSelect(p.id)}>
            <Avatar src={p.avatarUrl} name={p.fullName} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="min-w-0 truncate text-sm text-ink">{p.fullName}</strong>
                <StatusBadge tone={STATUS_TONE[p.approvalStatus]}>{STATUS_TEXT[p.approvalStatus]}</StatusBadge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.specialties.slice(0, 3).map((s) => <Chip key={s.id}>{s.name}</Chip>)}
                {p.specialties.length > 3 && <Chip variant="muted">+{p.specialties.length - 3}</Chip>}
                {p.specialties.length === 0 && <span className="text-xs text-subtle">Chưa chọn chuyên môn</span>}
              </div>
              <div className="flex flex-wrap gap-x-12px gap-y-1 text-[11.5px] text-subtle">
                <span className={META}><MapPin size={12} aria-hidden="true" /> {[p.provinceCity, p.operatingArea].filter(Boolean).join(" | ") || "-"}</span>
                <span className={META}><Briefcase size={12} aria-hidden="true" /> {p.experienceYears ?? 0} năm</span>
                <span className={META}><Clock size={12} aria-hidden="true" /> {formatRelative(p.approvalStatus === "PENDING" ? p.createdAt : p.reviewedAt)}</span>
              </div>
              {missing && (
                <div className="flex items-start gap-1.5 text-xs text-red-700"><AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> Thiếu CCCD, chưa thể duyệt</div>
              )}
            </div>
          </ListCard>
        );
      })}
    </ListCards>
  );
}
