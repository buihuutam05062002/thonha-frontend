import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Card, Button, Badge } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../styles/worker-map.css";
import {
  arriveAtRequest,
  getRequestOffer,
  startMoving,
} from "../../../api/offerApi";
import { parseApiError } from "../../../api/apiError";
import { connectWorkerChannel } from "../../../api/socket";
import { distanceMeters } from "../../../utils/geo";
import { getDirections } from "../../../api/mapApi";

// Fix icon mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DEFAULT_CENTER = [16.0544, 108.2022];
const LOCATION_SEND_INTERVAL_MS = 5000; // send the worker position at most every 5s
const ROUTE_RETRY_INTERVAL_MS = 10000; // retry a failed first route
const REROUTE_MIN_INTERVAL_MS = 30000; // refresh the route at most every 30s...
const REROUTE_MIN_MOVE_METERS = 150; // ...and only after moving at least 150m
const ARRIVE_CONFIRM_DISTANCE_METERS = 500;

function MapViewController({ workerPos, routePolyline }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!fittedRef.current && routePolyline.length > 1) {
      map.fitBounds(routePolyline, { padding: [70, 70] });
      fittedRef.current = true;
    }
  }, [routePolyline, map]);

  useEffect(() => {
    if (!workerPos) return;
    if (!fittedRef.current) {
      map.setView(workerPos, 15);
    } else if (!map.getBounds().contains(workerPos)) {
      map.panTo(workerPos);
    }
  }, [workerPos, map]);

  return null;
}

export default function WorkerMapPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const [navigationInfo, setNavigationInfo] = useState({
    requestCode: "",
    customerName: "",
    addressText: "",
    distanceKm: "--",
    durationMin: "--",
  });

  const [gpsAttempt, setGpsAttempt] = useState(0);
  const [customerPos, setCustomerPos] = useState(null);
  const [workerPos, setWorkerPos] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [pageError, setPageError] = useState(null);
  const [routeError, setRouteError] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("searching"); // searching | active | denied | unavailable
  const [socketConnected, setSocketConnected] = useState(false);
  const [arriving, setArriving] = useState(false);

  const channelRef = useRef(null);
  const lastSentRef = useRef(0);
  const routeOriginRef = useRef(null);
  const routeAttemptRef = useRef(0);
  const routeLoadingRef = useRef(false);

  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;

    let permissionStatus;
    const handleChange = () => {
      if (permissionStatus.state !== "denied") setGpsAttempt((n) => n + 1);
    };

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        permissionStatus = result;
        permissionStatus.addEventListener("change", handleChange);
      })
      .catch(() => {});

    return () => permissionStatus?.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const offer = await getRequestOffer(requestId);
        if (cancelled) return;

        if (offer.result !== "ACCEPTED") {
          navigate(`/worker/request/${requestId}`, { replace: true });
          return;
        }
        if (
          ["ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(offer.requestStatus)
        ) {
          navigate(`/worker/request/${requestId}/progress`, { replace: true });
          return;
        }
        if (offer.requestStatus === "CANCELLED") {
          setPageError("Khách đã hủy yêu cầu này.");
          return;
        }

        setNavigationInfo((prev) => ({
          ...prev,
          requestCode: offer.requestCode || "",
          customerName: offer.customerName || "Khách hàng",
          addressText: offer.addressText || "",
        }));

        if (offer.lat == null || offer.lng == null) {
          setPageError(
            "Yêu cầu này chưa có tọa độ của khách nên chưa thể chỉ đường.",
          );
        } else {
          setCustomerPos([Number(offer.lat), Number(offer.lng)]);
        }

        if (offer.requestStatus === "MATCHED") {
          await startMoving(requestId); // MATCHED -> ON_THE_WAY (idempotent)
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(
            parseApiError(err).message || "Không tải được thông tin đơn.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId, navigate]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = connectWorkerChannel({
      userId,
      topics: ["matching"],
      onMessage: (message) => {
        if (
          message.type === "REQUEST_CANCELLED" &&
          String(message.requestId) === String(requestId)
        ) {
          setPageError("Khách đã hủy yêu cầu này. Đang quay về trang chủ...");
          setTimeout(() => navigate("/worker/dashboard"), 2500);
        }
      },
      onConnectionChange: setSocketConnected,
    });
    channelRef.current = channel;

    return () => {
      channel.disconnect();
      channelRef.current = null;
    };
  }, [userId, requestId, navigate]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("unavailable");
      return undefined;
    }

    setGpsStatus("searching");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = [position.coords.latitude, position.coords.longitude];
        setWorkerPos(next);
        setGpsStatus("active");

        const now = Date.now();
        if (now - lastSentRef.current >= LOCATION_SEND_INTERVAL_MS) {
          const sent = channelRef.current?.publish("/app/worker/location", {
            requestId: Number(requestId),
            workerLat: next[0],
            workerLng: next[1],
          });
          if (sent) lastSentRef.current = now;
        }
      },
      (error) => {
        // 1 = permission denied, 2 = position unavailable, 3 = timeout
        console.warn("[gps]", error.code, error.message);
        setGpsStatus(
          error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [requestId, gpsAttempt]);

  useEffect(() => {
    if (!workerPos || !customerPos || routeLoadingRef.current) return;

    const now = Date.now();
    const sinceAttempt = now - routeAttemptRef.current;
    if (routeOriginRef.current) {
      if (sinceAttempt < REROUTE_MIN_INTERVAL_MS) return;
      if (
        distanceMeters(routeOriginRef.current, workerPos) <
        REROUTE_MIN_MOVE_METERS
      )
        return;
    } else if (sinceAttempt < ROUTE_RETRY_INTERVAL_MS) {
      return;
    }

    routeAttemptRef.current = now;
    routeLoadingRef.current = true;

    getDirections(workerPos, customerPos)
      .then((route) => {
        routeOriginRef.current = workerPos;
        setRoutePolyline(route.polyline);
        setRouteError(false);
        setNavigationInfo((prev) => ({
          ...prev,
          distanceKm: (route.distanceMeters / 1000).toFixed(1),
          durationMin: String(
            Math.max(1, Math.round(route.durationSeconds / 60)),
          ),
        }));
      })
      .catch((err) => {
        console.warn("[route]", err);
        setRouteError(true);
      })
      .finally(() => {
        routeLoadingRef.current = false;
      });
  }, [workerPos, customerPos]);

  const handleArrived = async () => {
    if (workerPos && customerPos) {
      const meters = distanceMeters(workerPos, customerPos);
      if (
        meters > ARRIVE_CONFIRM_DISTANCE_METERS &&
        !window.confirm(
          `Bạn còn cách khách khoảng ${Math.round(meters)} m. Xác nhận đã đến nơi?`,
        )
      ) {
        return;
      }
    }

    setArriving(true);
    setPageError(null);
    try {
      await arriveAtRequest(requestId); // ON_THE_WAY -> ARRIVED
      navigate(`/worker/request/${requestId}/progress`);
    } catch (err) {
      setPageError(
        parseApiError(err).message ||
          "Không thể cập nhật trạng thái, vui lòng thử lại.",
      );
    } finally {
      setArriving(false);
    }
  };

  const trackingActive = gpsStatus === "active" && socketConnected;
  const trackingLabel =
    gpsStatus === "searching"
      ? "Đang xác định vị trí..."
      : gpsStatus !== "active"
        ? "Không có GPS"
        : socketConnected
          ? "Chỉ đường Realtime"
          : "Mất kết nối máy chủ";

  const gpsMessage =
    gpsStatus === "denied"
      ? "Bạn đã chặn quyền vị trí. Hãy bật định vị cho trang này để chỉ đường."
      : gpsStatus === "unavailable"
        ? "Không lấy được vị trí GPS. Hãy kiểm tra định vị của thiết bị."
        : null;

  return (
    <div className="navigation-page-wrapper">
      {/* 1. Sticky Header */}
      <header className="nav-header-sticky px-3 py-2.5 border-bottom shadow-sm">
        <Container
          fluid
          className="d-flex align-items-center justify-content-between p-0"
        >
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="light"
              className="rounded-circle p-2 d-flex align-items-center justify-content-center border-0"
              style={{ width: "36px", height: "36px" }}
              onClick={() => navigate(-1)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <h1 className="h6 fw-bold text-dark mb-0">
              Đang di chuyển #{navigationInfo.requestCode}
            </h1>
          </div>

          <Badge
            bg={trackingActive ? "success-subtle" : "warning-subtle"}
            text={trackingActive ? "success" : "warning-emphasis"}
            className={`px-2.5 py-1.5 rounded-pill fw-semibold border ${
              trackingActive ? "border-success-subtle" : "border-warning-subtle"
            } d-flex align-items-center gap-1.5`}
          >
            <span
              className={`rounded-circle d-inline-block ${
                trackingActive ? "bg-success" : "bg-warning"
              }`}
              style={{ width: "6px", height: "6px" }}
            />
            {trackingLabel}
          </Badge>
        </Container>
      </header>

      {/* 2. Fullscreen Leaflet Map */}
      <div className="map-container-fullscreen">
        <MapContainer
          center={workerPos || customerPos || DEFAULT_CENTER}
          zoom={15}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          <MapViewController
            workerPos={workerPos}
            routePolyline={routePolyline}
          />

          {/* Marker vị trí Thợ */}
          {workerPos && (
            <Marker position={workerPos}>
              <Popup>Vị trí của bạn (Thợ)</Popup>
            </Marker>
          )}

          {/* Marker vị trí Khách hàng */}
          {customerPos && (
            <Marker position={customerPos}>
              <Popup>Điểm đến (Khách hàng)</Popup>
            </Marker>
          )}

          {/* Line chỉ đường màu cam (Goong overview_polyline đã giải mã) */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              color="#F5820D"
              weight={6}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* 3. Floating Bottom Overlay Card */}
      <div className="floating-bottom-panel">
        <Card className="floating-card p-3 p-md-4">
          {(pageError || gpsMessage || routeError) && (
            <div className="small text-danger fw-semibold mb-2">
              {pageError ||
                gpsMessage ||
                "Không lấy được đường đi, đang thử lại khi vị trí thay đổi."}
              {!pageError &&
                (gpsStatus === "denied" || gpsStatus === "unavailable") && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-2 fw-bold"
                    style={{ color: "#F5820D" }}
                    onClick={() => setGpsAttempt((n) => n + 1)}
                  >
                    Thử lại
                  </button>
                )}
            </div>
          )}

          {/* Khoảng cách & Thời gian */}
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div>
              <div
                className="text-uppercase text-muted fw-bold small"
                style={{ fontSize: "0.7rem" }}
              >
                Thời gian dự kiến
              </div>
              <div className="h3 fw-bold mb-0 text-dark">
                {navigationInfo.durationMin}{" "}
                <span className="fs-6 fw-normal text-muted">phút</span>
              </div>
            </div>
            <div className="text-end">
              <div
                className="text-uppercase text-muted fw-bold small"
                style={{ fontSize: "0.7rem" }}
              >
                Khoảng cách
              </div>
              <div className="h4 fw-bold mb-0" style={{ color: "#F5820D" }}>
                {navigationInfo.distanceKm}{" "}
                <span className="fs-6 fw-normal text-muted">km</span>
              </div>
            </div>
          </div>

          {/* Thông tin địa chỉ khách */}
          <div className="d-flex align-items-start gap-2.5 mb-3">
            <div className="rounded-circle bg-light p-2 d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  stroke="#F5820D"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="10"
                  r="3"
                  stroke="#F5820D"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <div className="fw-bold text-dark small">
                {navigationInfo.customerName}
              </div>
              <div
                className="text-secondary small text-truncate"
                style={{ maxWidth: "320px" }}
              >
                {navigationInfo.addressText}
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="d-flex gap-2">
            <Button
              className="btn-open-map-outline flex-grow-1 d-flex align-items-center justify-content-center gap-1.5"
              disabled={!customerPos}
              onClick={() => {
                if (!customerPos) return;
                const url = `https://www.google.com/maps/dir/?api=1&destination=${customerPos[0]},${customerPos[1]}&travelmode=driving`;
                window.open(url, "_blank");
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                  stroke="#F5820D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>App ngoài</span>
            </Button>

            <Button
              className="btn-arrived-main flex-grow-1"
              disabled={arriving}
              onClick={handleArrived}
            >
              {arriving ? "Đang xử lý..." : "Đã đến nơi"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
