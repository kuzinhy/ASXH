import React from "react";

export const OFFICIAL_FANPAGES = [
  {
    name: "Hội Cựu chiến binh phường",
    desc: "Hội Cựu chiến binh",
    url: "https://www.facebook.com/profile.php?id=61589414294258",
    icon: "https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-hoi-cuu-chien-binh-viet-nam.png",
  },
  {
    name: "Đoàn Thanh niên Phường",
    desc: "Tuổi trẻ & Phong trào",
    url: "https://web.facebook.com/TuoitrephuongPhuLoi",
    icon: "https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png",
  },
  {
    name: "MTTQ Việt Nam Phường",
    desc: "Ủy ban Mặt trận Tổ quốc",
    url: "https://web.facebook.com/MTTQphuloiHCM",
    icon: "https://www.mattrancantho.vn/files/images/Logo%20-%20Icon/Logo%20MTTQ.png",
  },
  {
    name: "Hội LH Phụ nữ Phường",
    desc: "Hội Liên hiệp Phụ nữ",
    url: "https://web.facebook.com/PHUNUPHUONGPHULOI",
    icon: "https://www.hoilhpn.org.vn/documents/20182/2314395/logohoimoi.jpg",
  },
  {
    name: "Công đoàn Phường",
    desc: "Bảo vệ quyền lợi Người lao động",
    url: "https://web.facebook.com/congdoanphuloiHCM",
    icon: "https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-Cong-Doan-Viet-Nam-CDVN.png",
  }
];

export default function OfficialFanpagesBar() {
  return (
    <div className="w-full">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-3 sm:p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          {OFFICIAL_FANPAGES.map((fanpage, index) => (
            <a
              key={index}
              href={fanpage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center cursor-pointer"
              title={`${fanpage.name} - ${fanpage.desc}`}
            >
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-red-500 opacity-0 group-hover:opacity-100 blur-xs transition duration-300" />
              <div className="relative w-10 h-10 rounded-full bg-white p-1.5 shadow-sm border border-slate-200 group-hover:border-transparent group-hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden">
                <img
                  src={fanpage.icon}
                  alt={fanpage.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 origin-bottom bg-slate-900/95 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none border border-slate-750">
                {fanpage.name}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
