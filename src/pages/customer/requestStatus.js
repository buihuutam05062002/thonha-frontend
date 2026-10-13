


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


export const TERMINAL = ['COMPLETED', 'NOT_FOUND', 'CANCELLED'];



export const CANCELLABLE = ['PENDING_MATCH', 'MATCHING', 'MATCHED', 'ON_THE_WAY'];


export const COMPLAINABLE = ['MATCHED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];


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
