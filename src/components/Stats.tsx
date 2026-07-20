import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { 
  Heart, Users, FileText, Gift, Award, BarChart3, Activity, Landmark, Sparkles, Eye,
  Search, Shield, Compass, Briefcase, Feather, Medal, ArrowUpRight, Flame, ClipboardList
} from "lucide-react";
import { QUARTERS_LIST } from "../constants";
import NewsFeed from "./NewsFeed";
import { NewsArticle } from "../types";

interface StatsProps {
  requestsCount: number;
  completedRequestsCount: number;
  totalDonationAmount: number;
  donorsCount: number;
  totalVisits?: number;
  onlineCount?: number;
  facebookNews?: NewsArticle[];
  currentUser?: any;
}

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
}

function AnimatedNumber({ value, formatter }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5s
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // Ease out exponential
      const current = Math.floor(ease * (endValue - startValue) + startValue);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, isInView]);

  return <span ref={ref}>{formatter ? formatter(displayValue) : (displayValue || 0).toLocaleString()}</span>;
}

interface OrgResult {
  title: string;
  detail: string;
  tag?: string;
}

const OUTSTANDING_RESULTS: Record<"mttq" | "youth" | "women" | "veterans" | "union", OrgResult[]> = {
  mttq: [
    { title: "Công tác tuyên truyền, vận động", detail: "931 cuộc, thu hút hơn 40.156 lượt người tham dự.", tag: "Tuyên truyền" },
    { title: "Chương trình “Nghĩa tình biên giới, hải đảo”", detail: "Hỗ trợ 5 triệu đồng tôn tạo Khu tưởng niệm Gạc Ma; tặng 2 bộ máy tính, 5 tủ sách, 25 phần đồ dùng học tập, 25 phần quà cho hộ dân, 50 suất ăn và quà, 300 phần quà cho học sinh, 15 đèn năng lượng mặt trời; tổng trị giá 150 triệu đồng.", tag: "Biên giới" },
    { title: "Tuyên truyền phòng, chống ma túy tại khu nhà trọ", detail: "Có hơn 100 người tham dự; hỗ trợ 5 đoàn viên công đoàn, trao 53 phần quà, tổng kinh phí khoảng 5 triệu đồng.", tag: "An ninh" },
    { title: "Chương trình “Đối thoại Tháng Năm”", detail: "Trao 10 phần quà cho công nhân khó khăn, có hơn 50 đại biểu tham dự.", tag: "Đối thoại" },
    { title: "Mô hình “Cà phê sáng – Trao đổi với Nhân dân”", detail: "Tổ chức 95 cuộc gặp gỡ, đối thoại, tiếp nhận 113 lượt ý kiến, kiến nghị.", tag: "Dân vận" },
    { title: "Hoạt động Quốc tế Thiếu nhi 1/6", detail: "Tổng kinh phí chăm lo trên 50 triệu đồng.", tag: "Chăm lo trẻ em" },
    { title: "Góp ý, hiệp thương bầu cử", detail: "Hội nghị triển khai nghị quyết và góp ý dự thảo luật có hơn 100 đại biểu; lấy ý kiến đối với 3 người ứng cử đại biểu Quốc hội và 113 người ứng cử đại biểu HĐND các cấp.", tag: "Dân chủ" },
    { title: "“Ngày thứ bảy văn minh”", detail: "Tổ chức 132 cuộc, thu hút hơn 6.651 lượt người tham gia.", tag: "Môi trường" },
    { title: "Cuộc vận động “Người Việt Nam ưu tiên dùng hàng Việt Nam”", detail: "Tổ chức 44 cuộc, có 2.121 lượt người tham dự.", tag: "Vận động" },
    { title: "Nhà Đại đoàn kết", detail: "Trao 1 căn nhà, tổng kinh phí 100 triệu đồng.", tag: "An cư" },
    { title: "Bếp ăn thiện nguyện", detail: "Phục vụ 3.000 suất ăn miễn phí, trị giá 60 triệu đồng.", tag: "Thiện nguyện" },
    { title: "“Chuyến xe xuân – San sẻ yêu thương”", detail: "Tổ chức 2 chuyến xe, trao 40 phần quà, tổng trị giá trên 20 triệu đồng.", tag: "Chăm lo Tết" },
    { title: "Chương trình SABECO", detail: "Trao 100 suất quà, trị giá 900.000 đồng/phần.", tag: "Quà tặng" },
    { title: "Chương trình “5.000 bộ áo dài yêu thương”", detail: "Đóng góp 200 bộ áo dài và 20 bộ vải áo dài.", tag: "Áo dài" },
    { title: "Ngày hội “Xuân đoàn kết – Tết nhân ái”", detail: "Trao 2.548 phần quà, tổng kinh phí hơn 2,3 tỷ đồng.", tag: "Tết nghĩa tình" },
    { title: "Chăm lo tại khu phố Phú Hòa 6", detail: "Trao 10 suất học bổng, 30 phần quà, phát 100 suất ăn miễn phí, tổng trị giá 30 triệu đồng.", tag: "Học bổng" },
    { title: "Chăm lo Mẹ Việt Nam Anh hùng", detail: "Thăm, tặng quà trị giá 6 triệu đồng.", tag: "Đền ơn đáp nghĩa" },
    { title: "Phối hợp các cơ sở tôn giáo", detail: "Trao 180 phần quà, trị giá 50 triệu đồng.", tag: "Tôn giáo" },
    { title: "Chăm lo đối tượng chính sách", detail: "Tặng quà cho 10 hội viên, tổng trị giá 6,5 triệu đồng.", tag: "Chính sách" },
    { title: "Mô hình khu nhà trọ an toàn", detail: "Có 100 người tham gia; trao 10 phần quà trị giá 250.000 đồng/phần, 10 cây xanh, 5 phần quà trị giá 500.000 đồng/phần.", tag: "Nhà trọ" },
    { title: "Công trình “Tuyến đường hoa – xanh – sạch”", detail: "Có hơn 70 cán bộ, chiến sĩ, hội viên và đại diện Ban Công tác Mặt trận 22 khu phố tham gia.", tag: "Cảnh quan" },
    { title: "Công tác hiệp thương bầu cử", detail: "Tổ chức 3 hội nghị hiệp thương.", tag: "Hiệp thương" }
  ],
  youth: [
    { title: "Chăm lo gia đình chính sách", detail: "Thăm, tặng quà 3 gia đình chính sách, tổng trị giá 5 triệu đồng.", tag: "Đền ơn" },
    { title: "“Xuân tình nguyện – Tết sẻ chia”", detail: "Trao 30 suất quà; thăm Mẹ Việt Nam Anh hùng và 4 gia đình chính sách; lắp đặt, sửa chữa 5 bóng đèn.", tag: "Tình nguyện" },
    { title: "Chăm lo thanh niên công nhân", detail: "Tổ chức 2 mâm cơm ngày Tết, trao 10 suất quà.", tag: "Công nhân" },
    { title: "Hoạt động môi trường", detail: "Tổ chức 3 đợt Ngày thứ bảy tình nguyện, 1 đợt Ngày chủ nhật xanh, thu hút hơn 300 đoàn viên, thanh niên.", tag: "Môi trường" },
    { title: "Trồng cây", detail: "Có hơn 60 đoàn viên, thanh niên, trồng mới hơn 100 cây xanh.", tag: "Trồng cây" },
    { title: "Tháng Công nhân", detail: "Trao 70 phần quà, trị giá 35 triệu đồng; tặng 350 suất ăn sáng miễn phí.", tag: "Tháng Công nhân" },
    { title: "Nghiệp đoàn vé số", detail: "Giới thiệu 10 thành viên tham gia.", tag: "Vé số" },
    { title: "Hỗ trợ trường hợp khó khăn", detail: "Thăm, hỗ trợ 6 trường hợp, tổng số tiền 6 triệu đồng.", tag: "Hỗ trợ" },
    { title: "“Căn phòng mơ ước”", detail: "Trao 1 căn phòng, miễn phí tiền thuê trong 12 tháng; tặng hơn 30 suất quà, tổng chi phí hơn 30 triệu đồng.", tag: "Mơ ước" },
    { title: "“Bình dân học vụ số”", detail: "Tổ chức 2 đợt tập huấn, có hơn 60 đoàn viên, thanh niên tham gia.", tag: "Công nghệ số" },
    { title: "Hiến máu", detail: "Có hơn 10 lượt hiến máu.", tag: "Hiến máu" },
    { title: "Hoạt động truyền thống", detail: "Thu hút hơn 200 đoàn viên, thanh thiếu nhi.", tag: "Truyền thống" },
    { title: "Sân chơi thiếu nhi", detail: "Tổ chức 3 hoạt động, thu hút hơn 100 lượt thiếu nhi.", tag: "Sân chơi" },
    { title: "Hành trình về nguồn", detail: "Tổ chức 3 hành trình, thu hút hơn 600 lượt người.", tag: "Về nguồn" },
    { title: "Phát triển lực lượng", detail: "Kết nạp 122 đoàn viên mới; giới thiệu 11 đoàn viên ưu tú cho Đảng xem xét.", tag: "Lực lượng" },
    { title: "Lớp học tình thương", detail: "Duy trì lớp học cho 20 trẻ em.", tag: "Lớp học" },
    { title: "Tập huấn tình nguyện hè", detail: "Có hơn 200 đoàn viên, thanh niên tham gia.", tag: "Hè tình nguyện" },
    { title: "Mô hình “Lá chắn xanh”", detail: "Tổ chức 1 đợt thăm hỏi, 2 hành trình tuyên truyền, phục vụ hơn 300 người.", tag: "Lá chắn xanh" }
  ],
  women: [
    { title: "Phóng sự “Thành phố muôn sắc hoa”", detail: "Thực hiện tại 3 địa điểm, có hơn 80 cán bộ, hội viên, phụ nữ tham gia.", tag: "Môi trường" },
    { title: "“Xuân đoàn kết – Tết nghĩa tình”", detail: "Trao 18 phần quà cho trẻ mồ côi, hỗ trợ 1 trẻ mồ côi do COVID-19, trao 20 phần quà cho người bán vé số, 15 phần quà cho phụ nữ khó khăn, 5 phần quà cho phụ nữ mắc bệnh ung thư; tổng trị giá 63 triệu đồng.", tag: "Chăm lo Tết" },
    { title: "Mô hình “Dân vận khéo”", detail: "Đăng ký 2 mô hình.", tag: "Dân vận" },
    { title: "Tuyên truyền pháp luật tại nhà trọ", detail: "Thu hút 100 công nhân, người lao động và hội viên phụ nữ.", tag: "Tuyên truyền" },
    { title: "Khu nhà trọ an toàn", detail: "Có 100 người tham gia; trao 10 phần quà trị giá 250.000 đồng/phần, 10 cây xanh, 5 phần quà trị giá 500.000 đồng/phần.", tag: "Nhà trọ" },
    { title: "Tọa đàm chăm sóc sức khỏe", detail: "Có 152 cán bộ, hội viên, phụ nữ tham gia.", tag: "Tọa đàm" },
    { title: "Hỗ trợ gia đình đặc biệt khó khăn", detail: "Vận động, trao hỗ trợ 18 triệu đồng.", tag: "Hỗ trợ" },
    { title: "“Ngày hội văn minh – Xuân nghĩa tình”", detail: "Có 200 người tham gia; trao 40 phần quà; tổng kinh phí 107.591.000 đồng.", tag: "Ngày hội" },
    { title: "Trao sinh kế", detail: "Trao 1 xe nước mía trị giá 10 triệu đồng.", tag: "Sinh kế" },
    { title: "Chăm lo hội viên", detail: "Trao 20 phần quà, trị giá 400.000 đồng/phần.", tag: "Chăm lo" },
    { title: "“Đỡ đầu nhân ái – Vun đắp tương lai”", detail: "Hỗ trợ 2 trường hợp, mức hỗ trợ 6 triệu đồng/người/năm.", tag: "Mẹ đỡ đầu" },
    { title: "Đồng diễn dân vũ áo dài", detail: "Có hơn 1.000 hội viên phụ nữ, học sinh tham gia.", tag: "Áo dài" },
    { title: "Cuộc thi video clip", detail: "Có 34 clip dự thi.", tag: "Cuộc thi" },
    { title: "Hội nghị “Hạnh phúc cho mọi gia đình”", detail: "Có khoảng 350 người tham gia; quà xã hội hóa trị giá khoảng 17,5 triệu đồng.", tag: "Hạnh phúc" },
    { title: "Cập nhật dữ liệu hội viên", detail: "Đạt tỷ lệ 100%.", tag: "Số hóa" }
  ],
  veterans: [
    { title: "Tổ chức Hội", detail: "Có 22 chi hội Cựu chiến binh khu phố.", tag: "Tổ chức" },
    { title: "Công tác tuyên truyền", detail: "Tổ chức 22 cuộc, có 1.988 lượt hội viên, thanh niên tham dự.", tag: "Tuyên truyền" },
    { title: "Câu lạc bộ làm kinh tế", detail: "Dự kiến thành lập với 18 thành viên.", tag: "Làm kinh tế" },
    { title: "Cấp đổi thẻ hội viên", detail: "Thực hiện 1.005/1.216 thẻ, đạt 82,6%.", tag: "Số hóa" },
    { title: "Phát triển hội viên", detail: "Kết nạp 12 hội viên mới.", tag: "Phát triển" },
    { title: "Chăm lo hội viên khó khăn", detail: "Tặng quà 10 hội viên, trị giá 8 triệu đồng.", tag: "Chăm lo" },
    { title: "Hội thi xe đạp chậm", detail: "Có 16 hội viên dự thi; trao 2 giải Nhất, 2 giải Nhì và 4 giải Ba.", tag: "Hội thao" },
    { title: "Hoạt động về nguồn", detail: "Có 21 người viếng đài liệt sĩ; 14 cán bộ tham gia về nguồn.", tag: "Về nguồn" },
    { title: "Tháng Công nhân", detail: "Huy động 40 cán bộ, hội viên tham dự.", tag: "Công nhân" },
    { title: "Giao lưu văn nghệ", detail: "Có 8 đơn vị, 85 diễn viên, biểu diễn 15 tiết mục, thu hút hơn 100 hội viên.", tag: "Giao lưu" }
  ],
  union: [
    { title: "Phát triển tổ chức Công đoàn", detail: "Thành lập mới 9 công đoàn cơ sở; kết nạp 233 đoàn viên, đạt 100% số lao động được vận động; vận động 10 lao động tự do tham gia Nghiệp đoàn vé số.", tag: "Tổ chức" },
    { title: "Hỗ trợ phương tiện về quê dịp Tết", detail: "Hỗ trợ 6 vé máy bay, 12 vé tàu, 28 vé xe.", tag: "Hỗ trợ Tết" },
    { title: "Chăm lo tại khu nhà trọ", detail: "Thăm, tặng quà 20 trường hợp không có điều kiện về quê.", tag: "Nhà trọ" },
    { title: "Quà Tết và phúc lợi", detail: "Đề xuất 1.580 suất quà Tết, 75 suất mua hàng trực tuyến, triển khai 700 voucher, trị giá 500.000 đồng/voucher.", tag: "Phúc lợi" },
    { title: "Hỗ trợ thiên tai", detail: "Hỗ trợ 4 trường hợp đoàn viên bị ảnh hưởng.", tag: "Cứu trợ" },
    { title: "Tháng Công nhân", detail: "Trao 80 phần quà, tổng trị giá 39 triệu đồng.", tag: "Tháng Công nhân" },
    { title: "Hỗ trợ đoàn viên khó khăn", detail: "Hỗ trợ 11 trường hợp, tổng số tiền 8 triệu đồng.", tag: "Hỗ trợ" },
    { title: "Chăm lo bữa ăn", detail: "Trao 350 suất ăn sáng miễn phí và 200 suất “Cơm yêu thương”.", tag: "Cơm xã hội" },
    { title: "Nghỉ dưỡng, chăm sóc sức khỏe", detail: "Tổ chức 2 đợt nghỉ dưỡng cho 27 người; chăm sóc sức khỏe cho 26 nữ đoàn viên.", tag: "Chăm sóc" },
    { title: "Bảo vệ quyền lợi người lao động", detail: "Tiếp nhận 5 đơn, vụ việc; đã giải quyết xong 4 vụ, còn 1 vụ đang xử lý.", tag: "Pháp lý" },
    { title: "Giải báo chí", detail: "Có 7 bài dự thi.", tag: "Giải báo chí" },
    { title: "Hoạt động văn hóa", detail: "Hội diễn “Duyên dáng Áo dài” đạt giải Nhì; cử 90 đoàn viên, người lao động tham gia giao lưu văn nghệ.", tag: "Dân vũ" },
    { title: "Phòng, chống ma túy tại nhà trọ", detail: "Hỗ trợ 5 đoàn viên, tổng số tiền 2 triệu đồng và trao 53 phần quà.", tag: "An toàn" }
  ]
};

export default function Stats({
  requestsCount,
  completedRequestsCount,
  totalDonationAmount,
  donorsCount,
  totalVisits = 14205,
  onlineCount = 18,
  facebookNews = [],
  currentUser
}: StatsProps) {
  const [activeChartTab, setActiveChartTab] = useState<"quarter" | "category">("quarter");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedQuarterIndex, setSelectedQuarterIndex] = useState<number>(2); // Default to KP 3
  const [selectedOrgTab, setSelectedOrgTab] = useState<"mttq" | "youth" | "women" | "veterans" | "union">("mttq");
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const statItems = [
    {
      id: "stat-donations",
      title: "Tổng Kinh Phí Vận Động",
      renderValue: () => <AnimatedNumber value={totalDonationAmount} formatter={formatCurrency} />,
      desc: "Tổng kinh phí do các doanh nghiệp, nhà hảo tâm tài trợ thông qua hệ thống",
      icon: Gift,
      textColor: "text-primary-600",
      bgColor: "bg-primary-50/60 backdrop-blur-sm",
      borderColor: "border-primary-100/80"
    },
    {
      id: "stat-requests",
      title: "Hồ Sơ Yêu Cầu Hỗ Trợ",
      renderValue: () => (
        <>
          <AnimatedNumber value={requestsCount} /> Đơn đề nghị
        </>
      ),
      desc: "Tổng số trường hợp khó khăn đã đăng ký hoặc được Tổ công nghệ số phản ánh",
      icon: FileText,
      textColor: "text-blue-600",
      bgColor: "bg-blue-50/60 backdrop-blur-sm",
      borderColor: "border-blue-100/80"
    },
    {
      id: "stat-completed",
      title: "Hồ Sơ Đã Giải Quyết",
      renderValue: () => (
        <>
          <AnimatedNumber value={completedRequestsCount} /> Hoàn tất
        </>
      ),
      desc: "Hồ sơ đã được thẩm định đạt yêu cầu và trao tặng nhu yếu phẩm, bảo hiểm BHYT",
      icon: Heart,
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50/60 backdrop-blur-sm",
      borderColor: "border-emerald-100/80"
    },
    {
      id: "stat-donors",
      title: "Nhà Hảo Tâm Đồng Hành",
      renderValue: () => (
        <>
          <AnimatedNumber value={donorsCount} /> Đơn vị/Cá nhân
        </>
      ),
      desc: "Cá nhân, tổ chức, nhà hảo tâm đã tham gia tài trợ và đóng góp",
      icon: Users,
      textColor: "text-teal-600",
      bgColor: "bg-teal-50/60 backdrop-blur-sm",
      borderColor: "border-teal-100/80"
    },
    {
      id: "stat-visits",
      title: "Số Lượt Truy Cập",
      renderValue: () => <AnimatedNumber value={totalVisits} />,
      desc: "Tổng số lượt truy cập hệ thống an sinh số thực tế được đếm tự động",
      icon: Eye,
      textColor: "text-slate-600",
      bgColor: "bg-slate-50/60 backdrop-blur-sm",
      borderColor: "border-slate-100/80"
    },
    {
      id: "stat-online",
      title: "Đang Trực Tuyến",
      renderValue: () => (
        <span className="flex items-center space-x-1.5 text-primary-600">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <AnimatedNumber value={onlineCount} /> người
        </span>
      ),
      desc: "Số lượng tài khoản và người dân đang trực tiếp truy cập tại thời điểm hiện tại",
      icon: Activity,
      textColor: "text-primary-600",
      bgColor: "bg-primary-50/60 backdrop-blur-sm",
      borderColor: "border-primary-100/80"
    }
  ];

  const quarterData = QUARTERS_LIST.map(q => ({
    name: q.shortName,
    requests: q.stats.requests,
    completed: q.stats.completed,
    funding: q.stats.funding,
    leader: q.officers.find(o => o.role === "Trưởng khu")?.name || "Chưa rõ",
    volunteers: q.stats.volunteers
  }));


  const categoryData = [
    { category: "Nhu yếu phẩm", percentage: 35, count: 82, funding: 55000000, color: "#2563eb" },
    { category: "Y tế & BHYT", percentage: 25, count: 51, funding: 42500000, color: "#3b82f6" },
    { category: "Khuyến học", percentage: 15, count: 41, funding: 35000000, color: "#0ea5e9" },
    { category: "Hỗ trợ việc làm", percentage: 15, count: 35, funding: 12000000, color: "#10b981" },
    { category: "Nhà ở Đại đoàn kết", percentage: 10, count: 31, funding: 80000000, color: "#1e3a8a" }
  ];

  const svgWidth = 600;
  const svgHeight = 270;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 80;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxRequests = 45;

  return (
    <section className="bg-transparent py-10 px-4" id="portal-stats">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[10px] font-bold text-primary-600 tracking-[0.2em] uppercase flex items-center justify-center space-x-1.5 font-sans">
            <Activity className="w-4 h-4 text-primary-500 animate-pulse" />
            <span>Chỉ Số Công Khai & Minh Bạch</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mt-2 font-serif">
            Hệ Thống Thống Kê <span className="text-primary-600 italic font-medium">An Sinh Số</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed font-medium">
            Biểu đồ phân phối nguồn tài trợ, tỷ lệ hoàn thành hồ sơ hỗ trợ khẩn cấp, cập nhật thời gian thực tại địa bàn các ban chỉ đạo khu phố của phường Phú Lợi.
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statItems.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.15)",
              }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: idx * 0.05 
              }}
              className="bg-white/85 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-[0_10px_30px_-15px_rgba(37,99,235,0.08)] hover:border-blue-500/40 hover:bg-white transition-colors duration-300 flex flex-col justify-between group relative overflow-hidden"
              id={stat.id}
            >
              {/* Subtle top decorative hover line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans group-hover:text-slate-800 transition-colors duration-300">{stat.title}</span>
                  <div className="text-lg sm:text-xl font-black text-slate-800 font-mono tracking-wide">
                    {stat.renderValue()}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl ${stat.bgColor} ${stat.textColor} shrink-0 border border-blue-500/10 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-blue-50/80 relative z-10">
                <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual Analytics Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block: Interactive Chart Container */}
          <div className="lg:col-span-8 bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(37,99,235,0.04)] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center space-x-2 font-sans uppercase tracking-wider">
                  <BarChart3 className="w-5 h-5 text-slate-800" />
                  <span>Biểu Đồ Phân Phối Cứu Trợ Phú Lợi</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Chọn khu phố hoặc hạng mục để hiển thị thông tin phân tích chuyên sâu.</p>
              </div>
              
              {/* Chart Tabs Toggle */}
              <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 self-end sm:self-auto shrink-0 relative">
                <button
                  onClick={() => setActiveChartTab("quarter")}
                  className={`relative px-5 py-2.5 text-[10px] font-black rounded-xl transition duration-300 uppercase tracking-widest select-none cursor-pointer ${
                    activeChartTab === "quarter" 
                      ? "text-white shadow-lg shadow-primary-500/25" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {activeChartTab === "quarter" && (
                    <motion.div
                      layoutId="activeChartTabBg"
                      className="absolute inset-0 bg-primary-600 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">14 Khu Phố</span>
                </button>
                <button
                  onClick={() => setActiveChartTab("category")}
                  className={`relative px-5 py-2.5 text-[10px] font-black rounded-xl transition duration-300 uppercase tracking-widest select-none cursor-pointer ${
                    activeChartTab === "category" 
                      ? "text-white shadow-lg shadow-primary-500/25" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {activeChartTab === "category" && (
                    <motion.div
                      layoutId="activeChartTabBg"
                      className="absolute inset-0 bg-primary-600 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 font-sans">Hạng Mục</span>
                </button>
              </div>
            </div>

            {/* Render Tab 1: Quarter Bar Chart */}
            <div className="flex-1 py-6 flex flex-col justify-center min-h-[240px]">
              {activeChartTab === "quarter" ? (
                <div className="w-full">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                    {/* Grid lines and guidelines */}
                    {[0, 15, 30, 45].map((val, i) => {
                      const yPos = paddingTop + chartHeight - (val / maxRequests) * chartHeight;
                      return (
                        <g key={i}>
                          <line 
                            x1={paddingX} 
                            y1={yPos} 
                            x2={svgWidth - paddingX} 
                            y2={yPos} 
                            className="stroke-blue-100" 
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text 
                            x={paddingX - 10} 
                            y={yPos + 4} 
                            textAnchor="end" 
                            className="fill-slate-400 text-[9px] font-mono font-medium"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars and labels */}
                    {quarterData.map((data, i) => {
                      const barWidth = chartWidth / quarterData.length - 12;
                      const barHeight = (data.requests / maxRequests) * chartHeight;
                      const completedHeight = (data.completed / maxRequests) * chartHeight;
                      const xPos = paddingX + i * (chartWidth / quarterData.length) + 6;
                      
                      const yReqs = paddingTop + chartHeight - barHeight;
                      const yCompleted = paddingTop + chartHeight - completedHeight;

                      const isSelected = selectedQuarterIndex === i;
                      const isHovered = hoveredBar === i;

                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredBar(i)}
                          onMouseLeave={() => setHoveredBar(null)}
                          onClick={() => setSelectedQuarterIndex(i)}
                        >
                          {/* Base shadow background for hover effect */}
                          <rect 
                            x={xPos - 4} 
                            y={paddingTop} 
                            width={barWidth + 8} 
                            height={chartHeight} 
                            fill={isSelected ? "rgba(59, 130, 246, 0.08)" : isHovered ? "rgba(59, 130, 246, 0.03)" : "transparent"} 
                            rx="6"
                          />

                          {/* Total Requests Bar */}
                          <rect 
                            x={xPos} 
                            y={yReqs} 
                            width={barWidth} 
                            height={barHeight} 
                            fill={isSelected ? "url(#goldGradSel)" : "url(#goldGradNormal)"}
                            rx="4"
                          />

                          {/* Completed Requests Bar */}
                          <rect 
                            x={xPos} 
                            y={yCompleted} 
                            width={barWidth} 
                            height={completedHeight} 
                            fill={isSelected ? "url(#amberGradSel)" : "url(#amberGradNormal)"}
                            rx="4"
                          />

                          {/* Interactive text tooltips on top */}
                          {(isHovered || isSelected) && (
                            <g>
                              <rect 
                                x={xPos + barWidth/2 - 24} 
                                y={yReqs - 22} 
                                width="48" 
                                height="16" 
                                fill="#2563eb" 
                                rx="4"
                              />
                              <text 
                                x={xPos + barWidth/2} 
                                y={yReqs - 10} 
                                textAnchor="middle" 
                                className="fill-white text-[9px] font-mono font-bold"
                              >
                                {data.completed}/{data.requests}
                              </text>
                              <polygon 
                                points={`${xPos + barWidth/2 - 4},${yReqs - 6} ${xPos + barWidth/2 + 4},${yReqs - 6} ${xPos + barWidth/2},${yReqs - 2}`}
                                fill="#2563eb"
                              />
                            </g>
                          )}

                          {/* Bottom Label (Khu phố 1, 2...) */}
                                                    <text 
                            x={xPos + barWidth / 2} 
                            y={svgHeight - paddingBottom + 16} 
                            textAnchor="end"
                            transform={`rotate(-45 ${xPos + barWidth / 2} ${svgHeight - paddingBottom + 16})`}
                            className={`text-[8px] font-bold font-sans ${
                              isSelected ? "fill-blue-600 font-extrabold" : "fill-slate-500"
                            }`}
                          >
                            {data.name}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="goldGradNormal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="goldGradSel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
                      </linearGradient>
                      <linearGradient id="amberGradNormal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.7" />
                      </linearGradient>
                      <linearGradient id="amberGradSel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
                        <stop offset="100%" stopColor="#172554" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Legend guide */}
                  <div className="flex justify-center items-center space-x-6 text-[10px] text-slate-500 font-black mt-4 uppercase tracking-widest">
                    <div className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded bg-primary-100 border border-primary-300 inline-block" />
                      <span className="font-sans">Hồ sơ đã tiếp nhận</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded bg-primary-600 inline-block" />
                      <span className="font-sans">Đã hoàn thành cứu trợ</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Category distribution chart */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                  
                  {/* Category Progress Bars */}
                  <div className="space-y-4">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-500 font-sans">{item.category}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{item.percentage}% ({item.count} hồ sơ)</span>
                        </div>
                        <div className="w-full bg-slate-50/80 backdrop-blur-md h-2 rounded-full overflow-hidden border border-slate-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Distribution descriptive panel */}
                  <div className="bg-slate-50/80 bg-blue-50/50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-2 font-sans">
                      <Award className="w-4 h-4 text-slate-800" />
                      <span>Cơ Cấu Quỹ An Sinh</span>
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                      Hơn <strong>40%</strong> nguồn lực cứu trợ tại Phường Phú Lợi được phân phối dưới dạng gạo, sữa, và thực phẩm thiết yếu đột xuất cho hộ gia đình. 
                      Các chương trình tài trợ <strong>Bảo hiểm Y tế miễn phí</strong> chiếm 25% ngân sách, giúp bảo vệ sức khỏe lâu dài cho người già neo đơn và trẻ em.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info notice block */}
            <div className="border-t border-primary-50 pt-5 text-[10px] text-slate-500 leading-relaxed flex items-center space-x-2 font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-primary-500 animate-spin-slow shrink-0" />
              <span>Dữ liệu liên thông Cơ sở dữ liệu dân cư Phú Lợi minh bạch.</span>
            </div>
          </div>

          {/* Right Block: Selected Quarter Details Panel */}
          <div className="lg:col-span-4 bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-3xl p-6 shadow-[0_20px_50px_rgba(37,99,235,0.04)] flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-[8px] bg-slate-50/80 bg-slate-100/50 text-slate-800 font-bold uppercase px-2.5 py-1 rounded-full border border-sky-500/20 font-sans tracking-[0.2em]">
                  Chi Tiết Địa Bàn
                </span>
                <h4 className="font-bold text-base text-slate-800 uppercase mt-2.5 font-sans tracking-wider">
                  {quarterData[selectedQuarterIndex].name}
                </h4>
                <p className="text-[10px] text-slate-500">Văn phòng Ban điều hành & Đội thanh niên tự quản.</p>
              </div>

              {/* Data list items */}
              <div className="space-y-3">
                <div className="bg-slate-50/80 bg-blue-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-light">Trưởng Khu phố:</span>
                  <span className="font-bold text-slate-800">{quarterData[selectedQuarterIndex].leader}</span>
                </div>
                
                <div className="bg-slate-50/80 bg-blue-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-light">Hồ sơ tiếp nhận:</span>
                  <span className="font-bold text-slate-800 font-mono">{quarterData[selectedQuarterIndex].requests} đơn</span>
                </div>

                <div className="bg-slate-50/80 bg-blue-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-light">Hoàn tất hỗ trợ:</span>
                  <span className="font-bold text-emerald-600 font-mono">✓ {quarterData[selectedQuarterIndex].completed} hộ</span>
                </div>

                <div className="bg-slate-50/80 bg-blue-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-light">Kinh phí cứu trợ:</span>
                  <span className="font-bold text-slate-800 font-mono text-xs">
                    {formatCurrency(quarterData[selectedQuarterIndex].funding)}
                  </span>
                </div>

                <div className="bg-slate-50/80 bg-blue-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-light">Đội ngũ Tình nguyện:</span>
                  <span className="font-bold text-slate-800">{quarterData[selectedQuarterIndex].volunteers} Đ/C</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 text-center">
              <a 
                href="#contact" 
                className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-slate-800 hover:text-sky-500 space-x-1 font-sans"
              >
                <span>Xem địa chỉ liên hệ</span>
                <Landmark className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Beautiful Partner & Campaign Section */}
        <div className="border-t border-slate-200/50 pt-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-bold text-sky-600 tracking-[0.2em] uppercase flex items-center justify-center space-x-1.5 font-sans">
              <Award className="w-4 h-4 text-slate-800 animate-bounce" />
              <span>Liên Kết Nghĩa Tình & Lan Tỏa Yêu Thương</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2 font-serif">
              Đồng Hành Cùng <span className="text-sky-600 italic font-medium">An Sinh Phú Lợi</span>
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed font-light">
              Mô hình quản lý chính quyền 2 cấp linh hoạt tại Phường Phú Lợi, Thành phố Hồ Chí Minh giúp thắt chặt mối quan hệ giữa nhà hảo tâm, cơ quan ban ngành và nhân dân một cách trực tiếp, nhanh chóng và hiệu quả.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Facebook News (5 cols) */}
            <div className="lg:col-span-5 space-y-4 h-[450px] lg:h-auto lg:min-h-[580px]">
              <NewsFeed news={facebookNews} currentUser={currentUser} />
            </div>

            {/* Right Column: Outstanding Milestones & Stats (7 cols) */}
            <div className="lg:col-span-7 flex flex-col h-[580px] bg-white/60 border border-slate-200 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="border-b border-slate-200/80 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center space-x-2 font-sans">
                    <Shield className="w-4 h-4 text-sky-600 animate-pulse" />
                    <span>Màn Hình Giám Sát Kết Quả Nổi Bật</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-light">Số liệu thực tế, thành tích nổi bật của các ban ngành & đoàn thể Phường Phú Lợi.</p>
                </div>
                
                {/* Micro Search Bar */}
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh kết quả..."
                    value={orgSearchQuery}
                    onChange={(e) => setOrgSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-sky-500/50 focus:bg-white transition-all text-slate-800"
                  />
                  {orgSearchQuery && (
                    <button 
                      onClick={() => setOrgSearchQuery("")}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Organization Tab Selection (Extremely polished bento tab switcher) */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/70 rounded-2xl mb-4">
                <button
                  onClick={() => { setSelectedOrgTab("mttq"); setOrgSearchQuery(""); }}
                  className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-extrabold rounded-xl transition duration-300 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedOrgTab === "mttq" 
                      ? "bg-red-600 text-white shadow-sm shadow-red-600/20" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Ủy ban MTTQ</span>
                  <span className="md:hidden">MTTQ</span>
                </button>
                <button
                  onClick={() => { setSelectedOrgTab("youth"); setOrgSearchQuery(""); }}
                  className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-extrabold rounded-xl transition duration-300 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedOrgTab === "youth" 
                      ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Đoàn TN</span>
                  <span className="md:hidden">Đoàn</span>
                </button>
                <button
                  onClick={() => { setSelectedOrgTab("women"); setOrgSearchQuery(""); }}
                  className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-extrabold rounded-xl transition duration-300 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedOrgTab === "women" 
                      ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Feather className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Hội Phụ Nữ</span>
                  <span className="md:hidden">Phụ nữ</span>
                </button>
                <button
                  onClick={() => { setSelectedOrgTab("veterans"); setOrgSearchQuery(""); }}
                  className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-extrabold rounded-xl transition duration-300 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedOrgTab === "veterans" 
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Medal className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Cựu Chiến Binh</span>
                  <span className="md:hidden">CCB</span>
                </button>
                <button
                  onClick={() => { setSelectedOrgTab("union"); setOrgSearchQuery(""); }}
                  className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-extrabold rounded-xl transition duration-300 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedOrgTab === "union" 
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Công Đoàn</span>
                  <span className="md:hidden">CĐ</span>
                </button>
              </div>

              {/* Scrollable Results Feed Container */}
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    const filtered = OUTSTANDING_RESULTS[selectedOrgTab].filter(item => 
                      item.title.toLowerCase().includes(orgSearchQuery.toLowerCase()) || 
                      item.detail.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                      (item.tag && item.tag.toLowerCase().includes(orgSearchQuery.toLowerCase()))
                    );

                    if (filtered.length === 0) {
                      return (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-12 text-center text-slate-400 text-xs italic font-light"
                        >
                          Không tìm thấy kết quả phù hợp với từ khóa "{orgSearchQuery}"
                        </motion.div>
                      );
                    }

                    // Dynamic colors based on active organization
                    const tagColors: Record<string, string> = {
                      mttq: "bg-red-50 text-red-700 border-red-200/50",
                      youth: "bg-sky-50 text-sky-700 border-sky-200/50",
                      women: "bg-rose-50 text-rose-700 border-rose-200/50",
                      veterans: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
                      union: "bg-indigo-50 text-indigo-700 border-indigo-200/50"
                    };

                    const dotColors: Record<string, string> = {
                      mttq: "bg-red-500",
                      youth: "bg-sky-500",
                      women: "bg-rose-500",
                      veterans: "bg-emerald-500",
                      union: "bg-indigo-500"
                    };

                    return filtered.map((item, index) => (
                      <motion.div
                        key={`${selectedOrgTab}-${index}-${item.title}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.15) }}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 text-left group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {item.tag && (
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase font-sans tracking-wider ${tagColors[selectedOrgTab]}`}>
                                {item.tag}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-mono font-medium flex items-center space-x-1 group-hover:text-slate-600 transition-colors">
                              <span>Báo cáo 2026</span>
                              <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            </span>
                          </div>
                          
                          <h5 className="font-bold text-xs text-slate-800 font-sans flex items-start space-x-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[selectedOrgTab]} shrink-0 mt-1.5`} />
                            <span>{item.title}</span>
                          </h5>
                          <p className="text-[10px] text-slate-500 font-light leading-relaxed pl-3.5">
                            {item.detail}
                          </p>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </AnimatePresence>
              </div>

              {/* Footer Indicator */}
              <div className="border-t border-slate-100 pt-2.5 mt-auto flex items-center justify-between text-[9px] text-slate-400 font-medium shrink-0">
                <span className="flex items-center space-x-1">
                  <ClipboardList className="w-3 h-3 text-slate-400" />
                  <span>Dữ liệu chính thức từ Ban Thường trực</span>
                </span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-[8px]">
                  Tổng cộng: {OUTSTANDING_RESULTS[selectedOrgTab].length} chỉ số
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}


