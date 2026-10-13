import { Copyright } from "lucide-react";
import logoImg from "../../assets/logo.png"; 

export function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4 md:col-span-1">
          <img
            src={logoImg}
            alt="Thợ Nhà"
            className="h-10 w-auto self-start filter invert"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            Thợ Nhà - Nền tảng kết nối dịch vụ sửa chữa và bảo trì gia đình
            chuyên nghiệp, nhanh chóng và đáng tin cậy.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
            Dịch vụ
          </h4>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sửa điện nước
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sửa máy lạnh
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Mộc & Nội thất
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Xây dựng & Sơn sửa
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
            Về Thợ Nhà
          </h4>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Giới thiệu
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Trở thành đối tác thợ
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Chính sách bảo mật
          </a>
          <a
            href="#"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Điều khoản dịch vụ
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
            Liên hệ
          </h4>
          <p className="text-xs text-gray-400">Hotline: 1900 xxxx</p>
          <p className="text-xs text-gray-400">Email: hotro@thonha.vn</p>
          <p className="text-xs text-gray-400">
            Địa chỉ: TP. Đà , Việt Nam
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        <Copyright size={12} className="inline align-[-1px]" aria-hidden="true" /> {new Date().getFullYear()} Thợ Nhà. All rights reserved.
      </div>
    </footer>
  );
}
