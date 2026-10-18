// Dùng chung cho trang danh sách và trang theo dõi yêu cầu của khách.
// Key trạng thái chính là giá trị RepairStatus của BE.

export const STAGES = ['PENDING_MATCH', 'MATCHED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

export const LABELS = {
    PENDING_MATCH: 'Chờ ghép thợ',
    MATCHING: 'Đang ghép thợ',
    MATCHED: 'Đã ghép thợ',
    ON_THE_WAY: 'Thợ đang di chuyển',
    IN_PROGRESS: 'Đang sửa chữa',
    COMPLETED: 'Hoàn thành',
    NOT_FOUND: 'Không tìm thấy thợ',
    CANCELLED: 'Đã huỷ',
};

export const BADGE_TONE = {
    PENDING_MATCH: 'wait',
    MATCHING: 'wait',
    MATCHED: 'active',
    ON_THE_WAY: 'active',
    IN_PROGRESS: 'active',
    COMPLETED: 'done',
    NOT_FOUND: 'bad',
    CANCELLED: 'bad',
};

// Trạng thái đã kết thúc: không cần cập nhật realtime nữa
export const TERMINAL = ['COMPLETED', 'NOT_FOUND', 'CANCELLED'];

// Khách được phép huỷ ở các trạng thái này. Khi thợ đã bắt đầu sửa (IN_PROGRESS) thì ẩn nút huỷ
// (BE hiện vẫn cho huỷ đến trước khi hoàn thành).
export const CANCELLABLE = ['PENDING_MATCH', 'MATCHING', 'MATCHED', 'ON_THE_WAY'];

// Đơn đã có thợ và chưa bị huỷ mới khiếu nại được (khớp điều kiện ở BE: MATCHED, ON_THE_WAY, IN_PROGRESS, COMPLETED)
export const COMPLAINABLE = ['MATCHED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

// Nhóm lọc ở trang "Yêu cầu của tôi". statuses là giá trị RepairStatus của BE (rỗng = tất cả).
export const REQUEST_FILTERS = [
    {key: 'all', label: 'Tất cả', statuses: []},
    {key: 'active', label: 'Đang xử lý', statuses: ['PENDING_MATCH', 'MATCHING', 'MATCHED', 'ON_THE_WAY', 'IN_PROGRESS']},
    {key: 'done', label: 'Hoàn thành', statuses: ['COMPLETED']},
    {key: 'closed', label: 'Huỷ / không có thợ', statuses: ['CANCELLED', 'NOT_FOUND']},
];

export const PRIORITY_LABELS = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp',
};
export const WARRANTY_LABELS = {
    PENDING: 'Chờ tiếp nhận',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Đã hoàn thành',
    REJECTED: 'Đã từ chối',
};

export const WARRANTY_TONE = {
    PENDING: 'wait',
    PROCESSING: 'active',
    COMPLETED: 'done',
    REJECTED: 'bad',
};