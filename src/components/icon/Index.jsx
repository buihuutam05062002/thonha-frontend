import {
  AirVent,
  Bell,
  Calendar,
  ClipboardList,
  Droplet,
  Home,
  MessageSquare,
  PaintBucket,
  Settings,
  User,
  Wallet,
  Zap,
} from "lucide-react";


const ACTIVE_COLOR = "#F5820D";
const ACTIVE_FILL = "#FFF0E0";
const SIZE = 20;

// Biến thể có trạng thái "đang chọn" (dùng cho thanh điều hướng)
function withActive(LucideIcon) {
  return function ActiveIcon({ active }) {
    return (
      <LucideIcon
        size={SIZE}
        aria-hidden="true"
        color={active ? ACTIVE_COLOR : "currentColor"}
        fill={active ? ACTIVE_FILL : "none"}
      />
    );
  };
}

function plain(LucideIcon) {
  return function PlainIcon() {
    return <LucideIcon size={SIZE} aria-hidden="true" />;
  };
}

export const IconBell = plain(Bell);
export const IconSettings = plain(Settings);
export const IconCalendar = plain(Calendar);
export const IconWallet = plain(Wallet);
export const IconProfile = plain(User);
export const IconSupport = plain(MessageSquare);
export const IconElec = plain(Zap);
export const IconPlumbing = plain(Droplet);
export const IconPaint = plain(PaintBucket);
export const IconAC = plain(AirVent);

export const IconHome = withActive(Home);
export const IconOrders = withActive(ClipboardList);
export const IconNotif = withActive(Bell);
export const IconUser = withActive(User);
