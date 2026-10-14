import {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Bike, Home} from 'lucide-react';

// Goong Maps JS (nhánh của Mapbox GL) nạp từ CDN lúc cần, không phải thêm dependency.
// Cần biến môi trường VITE_GOONG_MAPTILES_KEY (key "Maptiles" của Goong, khác key API dùng ở backend).
const GOONG_VERSION = '1.0.9';
const GOONG_JS = `https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@${GOONG_VERSION}/dist/goong-js.js`;
const GOONG_CSS = `https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@${GOONG_VERSION}/dist/goong-js.css`;
const STYLE_URL = 'https://tiles.goong.io/assets/goong_map_web.json';
const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;

let goongPromise = null;

function loadGoong() {
    if (window.goongjs) return Promise.resolve(window.goongjs);
    if (!goongPromise) {
        goongPromise = new Promise((resolve, reject) => {
            if (!document.querySelector(`link[href="${GOONG_CSS}"]`)) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = GOONG_CSS;
                document.head.appendChild(css);
            }
            const script = document.createElement('script');
            script.src = GOONG_JS;
            script.async = true;
            script.onload = () => resolve(window.goongjs);
            script.onerror = () => {
                goongPromise = null; // cho phép thử lại lần sau
                reject(new Error('Không tải được bản đồ'));
            };
            document.head.appendChild(script);
        });
    }
    return goongPromise;
}

/** Marker tròn có icon lucide (dùng chính bộ icon của app). Trả về {el, destroy}. */
function makePin(Icon, background) {
    const el = document.createElement('div');
    el.style.cssText =
        `width:36px;height:36px;border-radius:50%;background:${background};border:2px solid #fff;` +
        'box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;';
    const root = createRoot(el);
    root.render(<Icon size={18} color="#fff" strokeWidth={2.2} aria-hidden="true"/>);
    return {el, destroy: () => setTimeout(() => root.unmount(), 0)};
}

/**
 * Bản đồ (Goong) theo dõi thợ đang trên đường tới.
 * @param {{lat:number,lng:number}} customer  vị trí nhà khách
 * @param {{lat:number,lng:number,updatedAt:number}|null} worker  vị trí thợ mới nhất
 */
export default function WorkerTrackingMap({customer, worker}) {
    const boxRef = useRef(null);
    const mapRef = useRef(null);
    const workerMarkerRef = useRef(null);
    const fittedRef = useRef(false);
    const pinsRef = useRef([]); // để dọn các React root của marker
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!MAPTILES_KEY) return undefined;
        let cancelled = false;
        loadGoong()
            .then((goongjs) => {
                if (cancelled || !boxRef.current || mapRef.current) return;
                goongjs.accessToken = MAPTILES_KEY;
                const map = new goongjs.Map({
                    container: boxRef.current,
                    style: STYLE_URL,
                    center: [customer.lng, customer.lat], // Goong/Mapbox dùng thứ tự [kinh độ, vĩ độ]
                    zoom: 15,
                });
                map.addControl(new goongjs.NavigationControl({showCompass: false}), 'top-right');
                const home = makePin(Home, '#111111');
                pinsRef.current.push(home);
                new goongjs.Marker({element: home.el, anchor: 'center'})
                    .setLngLat([customer.lng, customer.lat])
                    .addTo(map);
                mapRef.current = map;
                setReady(true);
            })
            .catch(() => !cancelled && setFailed(true));
        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                workerMarkerRef.current = null;
                fittedRef.current = false;
                pinsRef.current.forEach((p) => p.destroy());
                pinsRef.current = [];
                setReady(false);
            }
        };
    }, [customer.lat, customer.lng]);

    useEffect(() => {
        const goongjs = window.goongjs;
        const map = mapRef.current;
        if (!ready || !map || !goongjs || !worker) return;
        const at = [worker.lng, worker.lat];
        if (!workerMarkerRef.current) {
            const bike = makePin(Bike, '#F5820D');
            pinsRef.current.push(bike);
            workerMarkerRef.current = new goongjs.Marker({element: bike.el, anchor: 'center'})
                .setLngLat(at)
                .addTo(map);
        } else {
            workerMarkerRef.current.setLngLat(at);
        }
        if (!fittedRef.current) {
            const sw = [Math.min(worker.lng, customer.lng), Math.min(worker.lat, customer.lat)];
            const ne = [Math.max(worker.lng, customer.lng), Math.max(worker.lat, customer.lat)];
            map.fitBounds([sw, ne], {padding: 60, maxZoom: 16, duration: 0});
            fittedRef.current = true;
        } else if (!map.getBounds().contains(at)) {
            map.easeTo({center: at});
        }
    }, [ready, worker, customer.lat, customer.lng]);

    if (!MAPTILES_KEY) {
        return <p className="muted">Chưa cấu hình bản đồ (thiếu VITE_GOONG_MAPTILES_KEY).</p>;
    }
    if (failed) {
        return <p className="muted">Không tải được bản đồ. Vị trí thợ vẫn được cập nhật khi bạn tải lại trang.</p>;
    }
    return <div ref={boxRef} style={{height: 260, borderRadius: 12, overflow: 'hidden', background: '#eee'}}/>;
}
