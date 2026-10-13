// Vị trí (theo %) của đường nối trong bộ chỉ báo bước ".stepper".
// Tính bằng JS theo số bước nên đường nối luôn khớp tâm vòng tròn đầu/cuối dù có 3, 4 hay 5 bước
// (CSS cũ cứng "repeat(5, ...)" nên khi chỉ còn 4 bước thì thanh bị lệch/cụt một nửa).

// Khoảng cách từ mép khung đến tâm vòng tròn đầu/cuối = nửa bề rộng một "cột".
function half(count) {
    return count > 0 ? 50 / count : 0;
}

export function stepperTrackStyle(count) {
    return {left: `${half(count)}%`, right: `${half(count)}%`};
}

// doneIndex: chỉ số (0-based) của bước hiện tại; phần màu cam chạy từ tâm vòng đầu tới tâm vòng hiện tại.
export function stepperFillStyle(count, doneIndex) {
    const h = half(count);
    const ratio = count > 1 ? Math.max(0, Math.min(1, doneIndex / (count - 1))) : 0;
    return {left: `${h}%`, width: `${(100 - 2 * h) * ratio}%`};
}
