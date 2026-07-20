/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportCategory, RequestStatus, Campaign, Donation, CitizenRequest } from "./types";

export interface QuarterOfficer {
  name: string;
  role: "Bí thư chi bộ" | "Trưởng khu" | "Trưởng BCTMT";
  phone: string;
  address: string;
}

export interface QuarterInfo {
  id: number;
  name: string;      // Tên chính thức hiển thị (ví dụ: Chánh Thiện (KP HT6))
  shortName: string; // Tên ngắn (ví dụ: Chánh Thiện)
  alias: string;     // Mã khu phố cũ / ký hiệu (ví dụ: KP HT6)
  oldName: string;   // Ghi chú khu phố cũ (ví dụ: Hiệp Thành 6 cũ)
  officers: QuarterOfficer[];
  stats: {
    requests: number;
    completed: number;
    funding: number;
    volunteers: number;
  };
}

// 14 Khu phố theo tài liệu chính thức của Đảng ủy Phường Phú Lợi
export const QUARTERS_LIST: QuarterInfo[] = [
  {
    id: 1,
    name: "Chánh Thiện (KP HT6)",
    shortName: "Chánh Thiện",
    alias: "KP HT6",
    oldName: "Hiệp Thành 6 cũ",
    officers: [
      { name: "Huỳnh Cẩm Tú", role: "Bí thư chi bộ", phone: "0902 66 23 23", address: "Số 96/41/4/9, Tổ 37, đường Nguyễn Văn Tiết Kp Chánh Thiện" },
      { name: "Phan Thị Kim Ngọc", role: "Trưởng khu", phone: "0916 10 98 70", address: "Số 503 đường Nguyễn Đức Thuận, Tổ 88, Kp Chánh Thiện" },
      { name: "Nguyễn Thị Tư", role: "Trưởng BCTMT", phone: "0913 78 57 79", address: "Số 748 Đường Phú Lợi, Kp Chánh Thiện" }
    ],
    stats: { requests: 18, completed: 14, funding: 28000000, volunteers: 15 }
  },
  {
    id: 2,
    name: "Hiệp Thành (KP HT5)",
    shortName: "Hiệp Thành",
    alias: "KP HT5",
    oldName: "Hiệp Thành 5 cũ",
    officers: [
      { name: "Nguyễn Thị Lan Hương", role: "Bí thư chi bộ", phone: "0975 26 60 72", address: "Số B122 tổ 62 Kp Hiệp Thành" },
      { name: "Võ Thị Mỹ Linh", role: "Trưởng khu", phone: "0983 90 85 80", address: "Số 28D4 Tổ 70, Kp Hiệp Thành" },
      { name: "Huỳnh Tấn Trung", role: "Trưởng BCTMT", phone: "0915 999 739", address: "KDC HT1, Tổ 63, Kp Hiệp Thành" }
    ],
    stats: { requests: 22, completed: 19, funding: 35000000, volunteers: 18 }
  },
  {
    id: 3,
    name: "Chánh An (KP HT7)",
    shortName: "Chánh An",
    alias: "KP HT7",
    oldName: "Hiệp Thành 7 cũ",
    officers: [
      { name: "Bùi Văn Đức", role: "Bí thư chi bộ", phone: "0918 93 11 12", address: "Số 300/26 đường Phạm Ngọc Thạch, tổ 99, Kp Chánh An" },
      { name: "Trần Thị Kim Liên", role: "Trưởng khu", phone: "0932 15 86 58", address: "Số 276/49 đường Phạm Ngọc Thạch, tổ 99 Kp Chánh An" },
      { name: "Nguyễn Thị Kim Liên", role: "Trưởng BCTMT", phone: "0946 42 44 87", address: "Số G151A tổ 95 Kp Chánh An" }
    ],
    stats: { requests: 45, completed: 38, funding: 72000000, volunteers: 34 }
  },
  {
    id: 4,
    name: "Phú Thuận (KP PL6)",
    shortName: "Phú Thuận",
    alias: "KP PL6",
    oldName: "Phú Lợi 6 cũ",
    officers: [
      { name: "Đoàn Thanh Phương", role: "Bí thư chi bộ", phone: "0917 957 315", address: "Số 347 tổ 57 đường Huỳnh Văn Lũy, Kp Phú Thuận" },
      { name: "Đỗ Công Ngọc", role: "Trưởng khu", phone: "0909 57 48 99", address: "Số 243/56/12 tổ 56 đường Nguyễn Bình, Kp Phú Thuận" },
      { name: "Nguyễn Thị Chung", role: "Trưởng BCTMT", phone: "0979 79 18 54", address: "Số 175 tổ 52 đường Huỳnh Văn Lũy, Kp Phú Thuận" }
    ],
    stats: { requests: 28, completed: 22, funding: 42000000, volunteers: 20 }
  },
  {
    id: 5,
    name: "Phú Hữu (KP PL7)",
    shortName: "Phú Hữu",
    alias: "KP PL7",
    oldName: "Phú Lợi 7 cũ",
    officers: [
      { name: "Vũ Quốc Dương", role: "Bí thư chi bộ", phone: "0968 25 07 68", address: "Số 288/8/77 Huỳnh Văn Lũy, Kp Phú Hữu" },
      { name: "Nguyễn Xuân Đức", role: "Trưởng khu", phone: "0964 46 52 95", address: "Số 220/113 Huỳnh Văn Lũy, Kp Phú Hữu" },
      { name: "Phạm Văn Khiên", role: "Trưởng BCTMT", phone: "0362 09 13 79", address: "Số 178/34 Huỳnh Văn Lũy, Kp Phú Hữu" }
    ],
    stats: { requests: 30, completed: 25, funding: 48000000, volunteers: 22 }
  },
  {
    id: 6,
    name: "Phú Hòa (KP PH8)",
    shortName: "Phú Hòa",
    alias: "KP PH8",
    oldName: "Phú Hòa 8 cũ",
    officers: [
      { name: "Phạm Đông Thành", role: "Bí thư chi bộ", phone: "0965 38 41 18", address: "Số 433/8 đường Lê Hồng Phong, KP Phú Hòa" },
      { name: "Trần Thủ Đô", role: "Trưởng khu", phone: "0966 45 23 70", address: "Số 385/55/16 đường Phú Lợi, KP Phú Hòa" },
      { name: "Lê Trọng Kỹ", role: "Trưởng BCTMT", phone: "0981 76 53 58", address: "Số 385/55/8/6 Lê Hồng Phong, KP Phú Hòa" }
    ],
    stats: { requests: 35, completed: 30, funding: 55000000, volunteers: 28 }
  },
  {
    id: 7,
    name: "Bình Điềm (KP PH3)",
    shortName: "Bình Điềm",
    alias: "KP PH3",
    oldName: "Phú Hòa 3 cũ",
    officers: [
      { name: "Trần Thị Hà", role: "Bí thư chi bộ", phone: "0974 89 12 21", address: "Số 1510 Chung cư Vạn Xuân Phú Lợi, số 26 đường Huỳnh Văn Lũy, KP Bình Điềm" },
      { name: "Đoàn Thành Nhân", role: "Trưởng khu", phone: "0944 35 75 44", address: "Số 264/51/70/22, đường Nguyễn Thị Minh Khai, tổ 4, KP Bình Điềm" },
      { name: "Huỳnh Viết Chuẩn", role: "Trưởng BCTMT", phone: "0528644295", address: "Số 34/15/3 Đường Phú Lợi, KP Bình Điềm" }
    ],
    stats: { requests: 42, completed: 35, funding: 65000000, volunteers: 32 }
  },
  {
    id: 8,
    name: "Phước An (KP PL3, HT8)",
    shortName: "Phước An",
    alias: "KP PL3, HT8",
    oldName: "Hiệp Thành 8 cũ / Phú Lợi 3 cũ",
    officers: [
      { name: "Nguyễn Hồng Trí", role: "Bí thư chi bộ", phone: "0901 26 26 19", address: "Số 17 đường số 6A, KDC Hiệp Thành 2, Kp Phước An" },
      { name: "Nguyễn Thị Ngọc Hồng", role: "Trưởng khu", phone: "0899 10 85 85", address: "Số 17 đường số 6A, KDC Hiệp Thành 2, Kp Phước An" },
      { name: "Lê Thị Hiền", role: "Trưởng BCTMT", phone: "0987 030 682", address: "Số 55/9 đường Huỳnh Văn Lũy, tổ 17, KP Phước An" }
    ],
    stats: { requests: 14, completed: 11, funding: 18000000, volunteers: 10 }
  },
  {
    id: 9,
    name: "Chợ Đình (KP PL1, PL2, PL4)",
    shortName: "Chợ Đình",
    alias: "KP PL1, PL2, PL4",
    oldName: "Phú Lợi 1, 2, 4 cũ",
    officers: [
      { name: "Phan Văn Dự", role: "Bí thư chi bộ", phone: "0913 76 17 55", address: "Số 67 đường Đoàn Thị Liên, KP Chợ Đình" },
      { name: "Lê Minh Mão", role: "Trưởng khu", phone: "0975 22 30 61", address: "Số 85/25B đường Phú Lợi, tổ 5, KP Chợ Đình" },
      { name: "Đỗ Hữu Hưng", role: "Trưởng BCTMT", phone: "0914 43 95 37", address: "Số 64/15, đường Trịnh Hoài Đức, KP Chợ Đình" }
    ],
    stats: { requests: 25, completed: 20, funding: 32000000, volunteers: 16 }
  },
  {
    id: 10,
    name: "Phú Bình (KP PL5, PL8)",
    shortName: "Phú Bình",
    alias: "KP PL5, PL8",
    oldName: "Phú Lợi 5, 8 cũ",
    officers: [
      { name: "Đặng Quang Phúc", role: "Bí thư chi bộ", phone: "0989 00 27 20", address: "Số 22/16 đường Bùi Văn Bình, KP Phú Bình" },
      { name: "Đỗ Xuân Điều", role: "Trưởng khu", phone: "0919 15 19 38", address: "Số 07 Đường Đoàn Thị Liên, KP Phú Bình" },
      { name: "Nguyễn Bá Toan", role: "Trưởng BCTMT", phone: "0366 29 79 50", address: "Số 22/26 đường Bùi Văn Bình, KP Phú Bình" }
    ],
    stats: { requests: 16, completed: 13, funding: 21000000, volunteers: 12 }
  },
  {
    id: 11,
    name: "Bình Thoại (KP PL9)",
    shortName: "Bình Thoại",
    alias: "KP PL9",
    oldName: "Phú Lợi 9 cũ / Bình Thoại",
    officers: [
      { name: "Phan Thị Nhiên", role: "Bí thư chi bộ", phone: "0909 19 89 31", address: "Số 613/10 đường Phú Lợi, Tổ 83, KP Bình Thoại" },
      { name: "Nguyễn Quốc Tuấn", role: "Trưởng khu", phone: "0984 44 82 30", address: "Số 585/94 đường Mỹ Phước Tân Vạn, Tổ 89, KP Bình Thoại" },
      { name: "Bùi Thị Thanh Phương", role: "Trưởng BCTMT", phone: "0982 45 79 45", address: "Hẻm 585 đường Mỹ Phước Tân Vạn, KP Bình Thoại" }
    ],
    stats: { requests: 29, completed: 24, funding: 44000000, volunteers: 20 }
  },
  {
    id: 12,
    name: "Vinh Sơn (KP PH1, PH2, PH6)",
    shortName: "Vinh Sơn",
    alias: "KP PH1, PH2, PH6",
    oldName: "Phú Hòa 1, 2, 6 cũ / Vinh Sơn",
    officers: [
      { name: "Trương Thị Tý", role: "Bí thư chi bộ", phone: "0918 048 070", address: "Số 41/22 đường 30/4, tổ 2, Kp Vinh Sơn" },
      { name: "Võ Trường Giang", role: "Trưởng khu", phone: "0903 77 88 27", address: "Số 40 đường 30/4, tổ 5, Kp Vinh Sơn" },
      { name: "Lê Thanh Hồng", role: "Trưởng BCTMT", phone: "0982 82 34 79", address: "Số 159/4 hẻm 159, đường 30/4, tổ 11 Kp Vinh Sơn" }
    ],
    stats: { requests: 24, completed: 18, funding: 38000000, volunteers: 19 }
  },
  {
    id: 13,
    name: "Phú Văn (KP PH4, PH7)",
    shortName: "Phú Văn",
    alias: "KP PH4, PH7",
    oldName: "Phú Hòa 4, 7 cũ / Phú Văn",
    officers: [
      { name: "Phan Hoàng Xô", role: "Bí thư chi bộ", phone: "0933 51 82 66", address: "Số 40 đường Phú Lợi, Trần Văn Ơn, Kp Phú Văn" },
      { name: "Phạm Thành Long", role: "Trưởng khu", phone: "090 766 46 44", address: "Số 370, Đường Lê Hồng Phong, Tổ 1, Kp Phú Văn" },
      { name: "Lương Phạm Duy Anh", role: "Trưởng BCTMT", phone: "098 788 08 89", address: "Số 646 Lê Hồng Phong, Tổ 4, Kp Phú Văn" }
    ],
    stats: { requests: 15, completed: 11, funding: 24000000, volunteers: 11 }
  },
  {
    id: 14,
    name: "Hòa Thạnh (KP PH9)",
    shortName: "Hòa Thạnh",
    alias: "KP PH9",
    oldName: "Phú Hòa 9 cũ / Hòa Thạnh",
    officers: [
      { name: "Lê Minh Đức Thạnh", role: "Bí thư chi bộ", phone: "0383 10 12 22", address: "Số 93/98/11 Nguyễn Thị Minh Khai, KP Hoà Thạnh" },
      { name: "Thái Văn Thu", role: "Trưởng khu", phone: "0902 76 67 49", address: "Số 189/116 đường Nguyễn Thị Minh Khai, KP Hoà Thạnh" },
      { name: "Hoàng Ngọc Thanh", role: "Trưởng BCTMT", phone: "0786 31 19 68", address: "Số 147/117/22 đường Nguyễn Thị Minh Khai, KP Hoà Thạnh" }
    ],
    stats: { requests: 12, completed: 9, funding: 15000000, volunteers: 8 }
  }
];

// Thống kê hỗ trợ từ báo cáo MTTQ Phường Phú Lợi năm 2026
export const MTTQ_REPORT_CAMPAIGNS: Campaign[] = [
  {
    id: "CAMP-MTTQ-01",
    title: "Chương trình Xuân đoàn kết - Tết nhân ái 2026",
    description: "Chăm lo tết - lan tỏa nghĩa tình, trao tặng 2.548 phần quà cho hộ nghèo, cận nghèo, hộ vừa thoát nghèo và học sinh khó khăn tại địa bàn phường.",
    targetAmount: 2500000000,
    currentAmount: 2300000000,
    category: "An sinh xã hội"
  },
  {
    id: "CAMP-MTTQ-02",
    title: "Xây dựng nhà Đại đoàn kết cho hộ nghèo",
    description: "Trao tặng nhà Đại đoàn kết cho hộ bà Phan Thị Hoàng Phúc (Khu phố Bình Thoại - Phú Lợi 9) và các gia đình dột nát khác dọn về nhà mới khang trang.",
    targetAmount: 200000000,
    currentAmount: 180000000,
    category: "Nhà ở"
  },
  {
    id: "CAMP-MTTQ-03",
    title: "Quỹ Học bổng nâng bước em đến trường",
    description: "Hỗ trợ học bổng học sinh khó khăn, phối hợp tặng thiết bị học tập, sách vở cho học sinh, trẻ mồ côi do Covid-19 và con em thanh niên công nhân.",
    targetAmount: 100000000,
    currentAmount: 85000000,
    category: "Khuyến học"
  },
  {
    id: "CAMP-MTTQ-04",
    title: "Hỗ trợ Sinh kế & Căn phòng mơ ước",
    description: "Trao tặng xe nước mía trị giá 10tr và heo đất tiết kiệm cho phụ nữ nghèo; tài trợ miễn phí 12 tháng tiền thuê nhà trọ cho thanh niên công nhân khó khăn.",
    targetAmount: 50000000,
    currentAmount: 45000000,
    category: "Sinh kế & Nhà trọ"
  }
];

export const MTTQ_REPORT_DONATIONS: Donation[] = [
  {
    id: "DON-MTTQ-001",
    donorName: "Công ty TNHH MTV Xổ số kiến thiết Tỉnh Bình Dương",
    amount: 12000000,
    campaignTitle: "Chương trình Xuân đoàn kết - Tết nhân ái 2026",
    message: "Kính chúc bà con và gia đình chính sách, các Mẹ VNAH luôn mạnh khỏe, đón Tết Bính Ngọ đầm ấm nghĩa tình.",
    createdAt: "2026-02-05T08:00:00Z"
  },
  {
    id: "DON-MTTQ-002",
    donorName: "Tập đoàn Bia SABECO",
    amount: 90000000,
    campaignTitle: "Chương trình Xuân đoàn kết - Tết nhân ái 2026",
    message: "Tài trợ chương trình 'Chung vị tết Việt gắn kết muôn miền', trao tặng 100 suất quà (900k/suất) cho hộ khó khăn và nữ công nhân nhà trọ.",
    createdAt: "2026-01-20T09:30:00Z"
  },
  {
    id: "DON-MTTQ-003",
    donorName: "Chùa Phước An & Chùa An Hòa",
    amount: 50000000,
    campaignTitle: "Chương trình Xuân đoàn kết - Tết nhân ái 2026",
    message: "Chung tay trao tặng 180 phần quà Tết ý nghĩa cho bà con nghèo vượt khó, lan tỏa tinh thần từ bi bác ái.",
    createdAt: "2026-01-28T14:15:00Z"
  },
  {
    id: "DON-MTTQ-004",
    donorName: "Nhóm Thiện nguyện Từ Tâm Phú Lợi",
    amount: 8000000,
    campaignTitle: "Hỗ trợ Sinh kế & Căn phòng mơ ước",
    message: "Thăm hỏi và tặng quà cho 10 hội viên Cựu chiến binh, người cao tuổi có hoàn cảnh đau ốm bệnh tật nặng.",
    createdAt: "2026-05-15T10:00:00Z"
  },
  {
    id: "DON-MTTQ-005",
    donorName: "Bếp ăn Thiện nguyện Phú Lợi",
    amount: 60000000,
    campaignTitle: "Chương trình Xuân đoàn kết - Tết nhân ái 2026",
    message: "Tài trợ 3.000 suất ăn miễn phí trị giá 20.000đ/suất dành riêng cho người bán vé số dạo, người lao động tự do nghèo.",
    createdAt: "2026-04-10T11:00:00Z"
  }
];

export const MTTQ_REPORT_REQUESTS: CitizenRequest[] = [
  {
    id: "REQ-MTTQ-001",
    fullName: "Bà Đào Thị Lợi (KP7)",
    phone: "0903112345",
    address: "Khu nhà trọ ông Kỳ, Khu phố Phú Hòa 7",
    quarter: "Bình Điềm (KP PH3)",
    category: SupportCategory.HOUSING,
    description: "Hộ bà Đào Thị Lợi tạm trú có hoàn cảnh đặc biệt khó khăn, mắc bệnh ung thư giai đoạn cuối qua đời, không có tiền lo hậu sự.",
    status: RequestStatus.COMPLETED,
    createdAt: "2026-03-10T08:00:00Z",
    notes: "Ủy ban MTTQ và Hội LHPN phường đã vận động hỗ trợ trực tiếp 18 triệu đồng lo chi phí mai táng ban đầu ấm cúng."
  },
  {
    id: "REQ-MTTQ-002",
    fullName: "Chị Phan Thị Hoàng Phúc (KP9)",
    phone: "0982554321",
    address: "Khu phố Bình Thoại (KP PL9 cũ)",
    quarter: "Bình Thoại (KP PL9)",
    category: SupportCategory.HOUSING,
    description: "Hộ nghèo khó khăn về nhà ở dột nát trầm trọng, có nguyện vọng được hỗ trợ xây sửa nhà và phương tiện mưu sinh.",
    status: RequestStatus.COMPLETED,
    createdAt: "2026-01-15T09:00:00Z",
    notes: "Đã bàn giao nhà Đại đoàn kết trị giá 100 triệu đồng cùng 01 chiếc xe nước mía sinh kế (trị giá 10 triệu đồng) và một heo đất tiết kiệm."
  },
  {
    id: "REQ-MTTQ-003",
    fullName: "Cháu Nguyễn Trọng Bình (KP2)",
    phone: "0912112233",
    address: "Hẻm 102 đường 30/4, Khu phố Phú Hòa 2",
    quarter: "Vinh Sơn (KP PH1, PH2, PH6)",
    category: SupportCategory.EDUCATION,
    description: "Trẻ em mồ côi do đại dịch Covid-19, gia cảnh nghèo neo đơn, mong muốn nhận trợ cấp học tập thường xuyên.",
    status: RequestStatus.COMPLETED,
    createdAt: "2026-02-12T10:30:00Z",
    notes: "Quỹ từ tâm phường đã trao tặng máy tính học tập cùng gói hỗ trợ sinh hoạt phí học tập thường niên trị giá 6 triệu đồng/năm."
  }
];
