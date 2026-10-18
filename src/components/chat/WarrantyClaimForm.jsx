import {useState} from 'react';
import {createWarrantyClaim} from '../../api/warrantyClaimApi';
import {notifySuccess} from '../../utils/notify';

const ACCENT = '#F5820D';
const MIN = 10;
const MAX = 1000;
const MAX_FILES = 5; // giới hạn phía giao diện, hãy đối chiếu với validateImages() ở WarrantyService

export default function WarrantyClaimForm({requestId, quotation, onDone}) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function submit(e) {
        e.preventDefault();
        const text = description.trim();
        if (text.length < MIN) {
            setError(`Vui lòng mô tả sự cố ít nhất ${MIN} ký tự`);
            return;
        }
        setBusy(true);
        setError('');
        try {
            await createWarrantyClaim({requestId, quotationId: quotation.id, description: text}, files);
            notifySuccess('Đã gửi yêu cầu bảo hành.');
            setOpen(false);
            setDescription('');
            setFiles([]);
            await onDone?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)}
                    style={{marginTop: 8, minHeight: 44, border: `1px solid ${ACCENT}`, borderRadius: 8, background: '#fff', color: '#b85500', padding: '8px 14px', fontWeight: 600, cursor: 'pointer'}}>
                Yêu cầu bảo hành
            </button>
        );
    }

    return (
        <form onSubmit={submit} style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10}}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={3} maxLength={MAX} disabled={busy}
                      placeholder="Mô tả sự cố bạn gặp lại sau khi sửa (ít nhất 10 ký tự)"
                      style={{border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, resize: 'vertical', width: '100%', boxSizing: 'border-box'}}/>
            <input type="file" accept="image/*" multiple disabled={busy}
                   onChange={(e) => setFiles(Array.from(e.target.files).slice(0, MAX_FILES))}/>
            <span style={{fontSize: 12, color: '#6b7280'}}>
                {files.length ? `Đã chọn ${files.length} ảnh` : `Ảnh minh chứng (không bắt buộc, tối đa ${MAX_FILES})`}
                {' · '}{description.trim().length}/{MAX}
            </span>
            {error && <div role="alert" style={{color: '#b42318', fontSize: 13}}>{error}</div>}
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                <button type="submit" disabled={busy}
                        style={{flex: '1 1 140px', minHeight: 44, border: 0, borderRadius: 8, background: ACCENT, color: '#1f1300', fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1}}>
                    {busy ? 'Đang gửi…' : 'Gửi yêu cầu bảo hành'}
                </button>
                <button type="button" disabled={busy} onClick={() => setOpen(false)}
                        style={{flex: '1 1 100px', minHeight: 44, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer'}}>
                    Hủy
                </button>
            </div>
        </form>
    );
}
