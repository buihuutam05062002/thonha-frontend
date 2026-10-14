import { Row, Col, Card } from "react-bootstrap";
import { ShieldCheck, Star } from "lucide-react";
import {
  IconCalendar,
  IconWallet,
  IconProfile,
  IconSupport,
} from "../../icon/Index";
import { useNavigate } from "react-router-dom";

const QUICK_MENU = [
  {
    label: "Bảo hành",
    icon: <ShieldCheck size={22} color="#F5820D" />,
    to: "/worker/warranty",
  },
  { label: "Lịch làm việc", icon: <IconCalendar />, key: "schedule" },
  { label: "Thu nhập / Ví", icon: <IconWallet />, key: "wallet" },
  {
    label: "Thu nhập & đánh giá",
    icon: <Star size={22} color="#F5820D" />,
    key: "earnings",
  },
  { label: "Hồ sơ của tôi", icon: <IconProfile /> },
  { label: "Hỗ trợ", icon: <IconSupport /> },
];

export function QuickMenu({ onOpenSchedule, onOpenWallet, onOpenEarnings }) {
  const navigate = useNavigate();

  const handlers = {
    schedule: onOpenSchedule,
    wallet: onOpenWallet,
    earnings: onOpenEarnings,
  };
  return (
    <div className="mb-4">
      <h6 className="fw-bold mb-3 text-dark">Truy cập nhanh</h6>
      <Row className="g-3">
        {QUICK_MENU.map((item) => {
          const handler = item.to
            ? () => navigate(item.to)
            : handlers[item.key];
          const active = Boolean(handler);

          return (
            <Col key={item.label} xs={6} sm={4} md>
              <Card
                className="border-0 shadow-sm rounded-4 text-center button-card"
                style={{
                  opacity: active ? 1 : 0.6,
                  cursor: active ? "pointer" : undefined,
                }}
                title={active ? undefined : "Sắp ra mắt"}
                role={active ? "button" : undefined}
                onClick={handler}
              >
                <Card.Body className="p-3 d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#FFF4E6",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="fw-semibold text-dark small">
                    {item.label}
                  </span>
                  {!active && (
                    <span className="text-muted" style={{ fontSize: 10 }}>
                      Sắp ra mắt
                    </span>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
