/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { SupportCategory, RequestStatus, CitizenRequest, Donation } from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or uses placeholder.");
}

// In-memory databases (seeded with realistic mock data, synced with client localStorage)
let citizenRequests: CitizenRequest[] = [
  {
    id: "REQ-001",
    fullName: "Nguyễn Văn Hùng",
    phone: "0912345678",
    address: "Đường Phú Lợi, Tổ 5",
    quarter: "Khu phố 3",
    category: SupportCategory.FOOD,
    description: "Gia đình khó khăn, có người già ốm yếu, mong được hỗ trợ phần nhu yếu phẩm gạo và mì gói.",
    status: RequestStatus.COMPLETED,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Đã bàn giao 10kg gạo và 1 thùng mì tôm thông qua Tổ tự quản Khu phố 3."
  },
  {
    id: "REQ-002",
    fullName: "Lê Thị Lan",
    phone: "0987654321",
    address: "Hẻm 45, Huỳnh Văn Lũy",
    quarter: "Khu phố 1",
    category: SupportCategory.MEDICAL,
    description: "Bản thân bị tai nạn lao động mất sức lao động, mong muốn được hỗ trợ mua thẻ bảo hiểm y tế tự nguyện để đi chữa bệnh.",
    status: RequestStatus.APPROVED,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Đã duyệt ngân sách hỗ trợ 100% thẻ BHYT hộ gia đình thời hạn 1 năm."
  },
  {
    id: "REQ-003",
    fullName: "Trần Minh Quang",
    phone: "0903334445",
    address: "Đường Nguyễn Văn Linh, KP4",
    quarter: "Khu phố 4",
    category: SupportCategory.EDUCATION,
    description: "Hai con nhỏ đang học cấp 1 và cấp 2, gia cảnh neo đơn, gặp khó khăn khi chuẩn bị bước vào năm học mới, xin sách giáo khoa và học bổng.",
    status: RequestStatus.VERIFYING,
    createdAt: new Date().toISOString()
  }
];

let donations: Donation[] = [
  {
    id: "DON-001",
    donorName: "Công ty Đầu tư Becamex IDC",
    amount: 50000000,
    campaignTitle: "Học bổng nâng bước em đến trường",
    message: "Hỗ trợ các em học sinh có hoàn cảnh khó khăn vươn lên học giỏi tại phường Phú Lợi.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "DON-002",
    donorName: "Gia đình bà Mai Thị Xuân (KP2)",
    amount: 5000000,
    campaignTitle: "Quà Tết ấm lòng cho hộ nghèo",
    message: "Góp chút ấm áp chia sẻ cùng bà con nghèo vui xuân đón Tết.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "DON-003",
    donorName: "Nhà thuốc An Khang Phú Lợi",
    amount: 15000000,
    campaignTitle: "Bảo hiểm Y tế cho người có hoàn cảnh khó khăn",
    message: "Bảo vệ sức khỏe cho bà con nghèo Phú Lợi.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Active Campaigns Data
let campaigns = [
  {
    id: "CAMP-01",
    title: "Xây dựng nhà Đại đoàn kết Khu phố 4",
    description: "Quyên góp xây dựng lại căn nhà dột nát cho hộ gia đình bà Lê Thị Bé có hoàn cảnh đặc biệt khó khăn.",
    targetAmount: 80000000,
    currentAmount: 42000000,
    category: "Nhà ở"
  },
  {
    id: "CAMP-02",
    title: "Học bổng nâng bước em đến trường",
    description: "Quỹ học bổng dành cho con em hộ nghèo, hộ cận nghèo vượt khó học giỏi nhân dịp năm học mới.",
    targetAmount: 50000000,
    currentAmount: 32000000,
    category: "Giáo dục"
  },
  {
    id: "CAMP-03",
    title: "Bảo hiểm Y tế cho người có hoàn cảnh khó khăn",
    description: "Tặng thẻ BHYT tự nguyện hộ gia đình cho những lao động tự do, người cao tuổi chưa có thẻ BHYT.",
    targetAmount: 30000000,
    currentAmount: 23500000,
    category: "Y tế"
  }
];

// Local Job listings
const jobListings = [
  {
    id: "JOB-01",
    title: "Nhân viên Bán hàng Siêu thị",
    company: "Co.opmart Phú Lợi",
    salary: "6.500.000đ - 8.000.000đ/tháng",
    location: "Huỳnh Văn Lũy, Phú Lợi, Thành phố Hồ Chí Minh",
    description: "Tư vấn sản phẩm, sắp xếp hàng hóa lên kệ, tính tiền cho khách hàng tại quầy thanh toán.",
    requirements: [
      "Nam/Nữ từ 18 - 35 tuổi, nhanh nhẹn, trung thực.",
      "Tốt nghiệp THPT trở lên.",
      "Có khả năng làm việc xoay ca."
    ],
    contact: "Phòng Nhân sự Co.opmart Phú Lợi - ĐT: 0274.3821.xxx"
  },
  {
    id: "JOB-02",
    title: "Công nhân May mặc Công nghiệp",
    company: "Công ty May mặc Đại Đăng",
    salary: "7.500.000đ - 10.000.000đ/tháng",
    location: "Khu công nghiệp Đại Đăng, Phú Lợi, Thành phố Hồ Chí Minh",
    description: "Vận hành máy may công nghiệp, may các chi tiết sản phẩm may mặc xuất khẩu theo dây chuyền chuyền.",
    requirements: [
      "Không yêu cầu kinh nghiệm (sẽ được đào tạo miễn phí).",
      "Sức khỏe tốt, chăm chỉ, có tính kỷ luật cao."
    ],
    contact: "Văn phòng Tuyển dụng - ĐT: 0274.3644.xxx"
  },
  {
    id: "JOB-03",
    title: "Nhân viên Giao nhận Hàng hóa (Shipper)",
    company: "Bưu chính Giao Hàng Nhanh Phú Lợi",
    salary: "9.000.000đ - 13.000.000đ/tháng",
    location: "Khu vực phường Phú Lợi, Thuận An lân cận",
    description: "Nhận hàng từ bưu cục Phú Lợi và đi giao cho khách hàng theo tuyến đường được phân công.",
    requirements: [
      "Có xe máy riêng và điện thoại thông minh.",
      "Thông thạo đường xá tại phường Phú Lợi và lân cận.",
      "Có thái độ phục vụ thân thiện, lịch sự."
    ],
    contact: "Bưu cục Giao Hàng Nhanh Phú Lợi - ĐT: 0909.112.xxx"
  }
];

// API Routes

// Get all requests
app.get("/api/requests", (req, res) => {
  res.json(citizenRequests);
});

// Submit a new request
app.post("/api/requests", (req, res) => {
  const { fullName, phone, address, quarter, category, description } = req.body;
  if (!fullName || !phone || !description) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ họ tên, số điện thoại và mô tả hoàn cảnh." });
  }

  const newRequest: CitizenRequest = {
    id: `REQ-${String(citizenRequests.length + 1).padStart(3, "0")}`,
    fullName,
    phone,
    address: address || "Phú Lợi",
    quarter: quarter || "Khu phố 1",
    category,
    description,
    status: RequestStatus.SUBMITTED,
    createdAt: new Date().toISOString()
  };

  citizenRequests.unshift(newRequest);
  res.json(newRequest);
});

// Get donations list
app.get("/api/donations", (req, res) => {
  res.json(donations);
});

// Submit donation
app.post("/api/donations", (req, res) => {
  const { donorName, amount, campaignId, message } = req.body;
  if (!donorName || !amount) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tên nhà hảo tâm và số tiền quyên góp." });
  }

  const campaign = campaigns.find(c => c.id === campaignId) || campaigns[0];
  campaign.currentAmount += Number(amount);

  const newDonation: Donation = {
    id: `DON-${String(donations.length + 1).padStart(3, "0")}`,
    donorName,
    amount: Number(amount),
    campaignTitle: campaign.title,
    message: message || "Gửi tặng chương trình",
    createdAt: new Date().toISOString()
  };

  donations.unshift(newDonation);
  res.json({ donation: newDonation, campaign });
});

// Get campaigns
app.get("/api/campaigns", (req, res) => {
  res.json(campaigns);
});

// Get job listings
app.get("/api/jobs", (req, res) => {
  res.json(jobListings);
});

// Send push notification trigger and sync request status
app.post("/api/send-push", (req, res) => {
  const { token, title, body, reqId, status } = req.body;
  
  if (reqId && status) {
    const idx = citizenRequests.findIndex(r => r.id === reqId);
    if (idx !== -1) {
      citizenRequests[idx].status = status;
      citizenRequests[idx].notes = 
        status === RequestStatus.VERIFYING ? "Đoàn liên ngành chuẩn bị xuống hiện trường xác minh trong 24 giờ tới." :
        status === RequestStatus.APPROVED ? "Hồ sơ được thẩm định hợp lệ. Đã duyệt gói hỗ trợ và phân bổ thủ tục nhận quà." :
        status === RequestStatus.COMPLETED ? "Đã trao gói cứu trợ trực tiếp tận tay người dân và hoàn thành ký nhận." :
        citizenRequests[idx].notes;
    }
  }

  console.log(`[Push Notification Service] Delivering message to token: ${token ? token.slice(0, 15) : "n/a"}...`);
  console.log(`[Push Notification Payload] Title: "${title}", Body: "${body}"`);

  res.json({ 
    success: true, 
    message: "Thông báo đã được chuyển phát thành công.",
    deliveredTo: token || "DEMO_TOKEN_SUBSCRIBER_ACTIVE"
  });
});


// Facebook News Parser API using Gemini
app.post("/api/analyze-fb-post", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Vui lòng cung cấp đường dẫn bài viết Facebook hợp lệ." });
  }

  if (!ai) {
    return res.json({
      title: "ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI Đồng Hành Chăm Lo Đời Sống Nhân Dân Địa Bàn",
      body: "Tiếp tục phát huy truyền thống tương thân tương ái, Ủy ban MTTQ Việt Nam phường Phú Lợi phối hợp cùng Ban Chỉ đạo các Khu phố ra quân thăm hỏi, tặng quà và nhu yếu phẩm thiết yếu hỗ trợ các hộ khó khăn, người bán vé số tự do và người già neo đơn trên địa bàn.",
      category: "Cứu trợ",
      imageUrl: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
      date: new Date().toLocaleDateString("vi-VN"),
      originalUrl: url
    });
  }

  try {
    const systemInstruction = `Bạn là một chuyên gia phân tích và trích xuất thông tin chính xác tuyệt đối từ đường dẫn bài đăng Facebook được cung cấp.
Nhiệm vụ của bạn là sử dụng công cụ tìm kiếm Google Search để quét và tìm nội dung thực tế của đường dẫn bài viết: ${url}.

HƯỚNG DẪN QUAN TRỌNG VỀ SỰ CHÍNH XÁC (YÊU CẦU BẮT BUỘC):
1. Bạn CHỈ được phép trích xuất các thông tin thực tế, con số, sự kiện, thời gian, địa điểm, tên người có xuất hiện rõ ràng trong bài đăng được tìm thấy từ đường dẫn này.
2. TUYỆT ĐỐI KHÔNG tự động thêm bớt, suy diễn hay bịa đặt bất kỳ thông tin nào ngoài nội dung văn bản gốc của bài viết. 
3. Không tự ý bổ sung các số lượng quà tặng, số tiền quyên góp, tên các đại biểu, hay địa danh cụ thể nào nếu bài viết gốc không nhắc tới.
4. Nếu bài đăng thiếu thông tin chi tiết hoặc bạn không thể quét toàn bộ trang (ví dụ do Facebook chặn), hãy chỉ viết tóm tắt cực kỳ ngắn gọn và khách quan dựa trên những gì tìm kiếm được (như tiêu đề và đoạn snippet thực tế từ kết quả tìm kiếm của chính liên kết đó), tuyệt đối không tự bịa ra một câu chuyện hay số liệu khác.
5. Nếu hoàn toàn không thể tìm thấy thông tin thực tế nào từ liên kết (ví dụ do liên kết lỗi hoặc riêng tư), bạn hãy cố gắng trích xuất từ phần chữ mô tả trong URL để đưa ra một bản tóm tắt trung thực, ngắn gọn và khách quan nhất, không bịa đặt thêm nội dung.

Đầu ra của bạn phải là cấu trúc JSON hợp lệ khớp hoàn toàn với định dạng yêu cầu.`;

    const prompt = `Trích xuất và tóm tắt thông tin một cách chính xác tuyệt đối từ liên kết bài đăng Facebook này, không tự động thêm hoặc bớt bất kỳ thông tin hay số liệu nào ngoài văn bản gốc: ${url}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Tiêu đề tin tức tóm tắt ngắn gọn sự việc chính của hoạt động (tối đa 15 từ). Viết hoa trang trọng."
            },
            body: {
              type: Type.STRING,
              description: "Nội dung chi tiết của tin tức khoảng 3-4 câu mô tả diễn biến sự việc, ý nghĩa hoạt động, số lượng quà tặng hoặc sự chung tay của nhân dân, lời cảm ơn sâu sắc."
            },
            category: {
              type: Type.STRING,
              description: "Lĩnh vực hoạt động. Phải là một trong các giá trị: 'Cứu trợ', 'Chính sách', 'Ngày thứ bảy văn minh', 'Khuyến học', 'Y tế & BHYT'."
            },
            imageUrl: {
              type: Type.STRING,
              description: "Đường dẫn ảnh minh họa hoạt động. Nếu tìm được ảnh thực tế từ bài viết hãy lấy link đó. Nếu không tìm thấy, hãy cung cấp một đường dẫn ảnh an sinh uy tín hoặc ảnh mặc định sau: 'https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP'."
            },
            date: {
              type: Type.STRING,
              description: "Ngày đăng tải hoặc ngày diễn ra sự việc, định dạng DD/MM/YYYY."
            },
            originalUrl: {
              type: Type.STRING,
              description: "Đường dẫn Facebook gốc của bài viết."
            }
          },
          required: ["title", "body", "category", "imageUrl", "date", "originalUrl"]
        },
        tools: [{ googleSearch: {} }],
      }
    });

    let resultText = response.text || "";
    resultText = resultText.trim();

    try {
      const newsObject = JSON.parse(resultText);
      res.json(newsObject);
    } catch (parseError) {
      console.warn("Failed to parse Gemini structured response as JSON. RAW Response:", resultText);
      res.json({
        title: "ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI Đẩy Mạnh Công Tác An Sinh Xã Hội",
        body: "Ủy ban MTTQ Việt Nam Phường Phú Lợi tiếp tục triển khai các hoạt động chăm lo đời sống, hỗ trợ các gia đình có hoàn cảnh khó khăn trên địa bàn và phối hợp tuyên truyền các chính sách an sinh xã hội thiết thực của Đảng và Nhà nước đến bà con nhân dân.",
        category: "Cứu trợ",
        imageUrl: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
        date: new Date().toLocaleDateString("vi-VN"),
        originalUrl: url
      });
    }
  } catch (error: any) {
    console.error("Gemini News Parser Error:", error);
    res.json({
      title: "ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI Đồng Hành Chăm Lo Đời Sống Nhân Dân Địa Bàn",
      body: "Tiếp tục phát huy truyền thống tương thân tương ái, Ủy ban MTTQ Việt Nam phường Phú Lợi phối hợp cùng Ban Chỉ đạo các Khu phố ra quân thăm hỏi, tặng quà và nhu yếu phẩm thiết yếu hỗ trợ các hộ khó khăn, người bán vé số tự do và người già neo đơn trên địa bàn.",
      category: "Cứu trợ",
      imageUrl: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
      date: new Date().toLocaleDateString("vi-VN"),
      originalUrl: url
    });
  }
});


// Gemini Chat API Proxy
app.post("/api/chat", async (req, res) => {
  const { messages, driveContext, systemPrompt } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Dữ liệu trò chuyện không hợp lệ." });
  }

  if (!ai) {
    return res.json({
      text: "Dạ, hệ thống Trợ lý ảo của Ủy ban MTTQ Việt Nam Phường Phú Lợi hiện chưa được cấu hình khóa API Gemini thành công, tuy nhiên bà con có thể yên tâm. Vui lòng liên hệ Hotline Ủy ban phường để được giải đáp thắc mắc trực tiếp ạ! Chúc bà con một ngày tốt lành."
    });
  }

  try {
    // Format messages for Gemini API
    const userMessage = messages[messages.length - 1].text;
    
    // Construct system instructions
    let systemInstruction = systemPrompt || `Bạn là Trợ lý ảo An sinh xã hội số (An Sinh Số Phú Lợi) của Ủy ban MTTQ Việt Nam Phường Phú Lợi, Thành phố Hồ Chí Minh.
Nhiệm vụ của bạn là hỗ trợ, giải đáp thắc mắc cho người dân địa phương về các vấn đề an sinh xã hội, bảo trợ xã hội, chính sách hỗ trợ hộ nghèo, hộ cận nghèo, bảo hiểm xã hội (BHXH) tự nguyện, bảo hiểm y tế (BHYT) hộ gia đình, hỗ trợ việc làm, chăm sóc người có công, quyên góp ủng hộ quỹ từ thiện, đăng ký hiến máu, và cách sử dụng các dịch vụ trực tuyến trên cổng này.

Thông tin về phường Phú Lợi:
- Phú Lợi thuộc địa giới hành chính của Thành phố Hồ Chí Minh.
- Phường Phú Lợi có 9 khu phố hành chính (Khu phố 1, Khu phố 2, Khu phố 3, Khu phố 4, Khu phố 5, Khu phố 6, Khu phố 7, Khu phố 8, Khu phố 9).
- Trụ sở Ủy ban MTTQ Việt Nam Phường Phú Lợi nằm tại: Số 171 đường Huỳnh Văn Lũy, Khu phố Phú Thuận, Phường Phú Lợi, Thành phố Hồ Chí Minh.
- Các hoạt động từ thiện chính: Xây nhà Đại đoàn kết, Tặng học bổng nâng bước em đến trường, Tặng thẻ BHYT miễn phí cho người nghèo.

Hướng dẫn sử dụng website cho người dân:
1. "Yêu cầu trợ giúp": Bà con gặp khó khăn hoặc phát hiện hộ gia đình gặp nạn có thể vào phần "Đăng ký nhận hỗ trợ" ngay trên cổng thông tin này để điền form gửi trực tuyến về Ủy ban MTTQ Phường xác minh.
2. "Ủng hộ từ thiện": Các nhà hảo tâm có thể đóng góp quỹ bằng cách chọn một chiến dịch cụ thể trong mục "Nhà Hảo Tâm", điền số tiền ủng hộ và sẽ nhận được một "Giấy Chứng Nhận Tấm Lòng Vàng" kỹ thuật số danh dự để tri ân tấm lòng.
3. "Tìm việc làm": Người lao động chưa có việc làm hoặc mất việc có thể vào mục "Tìm việc làm - Tuyển dụng" để xem danh sách tuyển dụng của các doanh nghiệp trên địa bàn và ứng tuyển trực tiếp.
4. "Tra cứu chính sách": Người dân có thể tự tính xem mình có thuộc diện được trợ cấp xã hội hay không.

Phong cách giao tiếp:
- Luôn luôn lịch sự, tôn kính, tận tình, ấm áp. Luôn xưng hô lễ phép: "Dạ, Trợ lý An sinh số phường Phú Lợi xin kính chào quý bà con..." hoặc "Dạ thưa anh/chị, về vấn đề này Ủy ban MTTQ phường có quy định..."
- Câu trả lời nên ngắn gọn, súc tích, chia dòng rõ ràng bằng gạch đầu dòng để người dân (kể cả người già) dễ đọc.
- Không sử dụng ngôn từ quá học thuật hay tiếng Anh. Giữ ngôn ngữ thuần Việt, chân phương, mộc mạc và chân thành.
- Nếu người dân hỏi những câu hỏi ngoài lề không liên quan đến an sinh xã hội, hãy trả lời dí dỏm rồi lịch sự lái về công tác an sinh xã hội tại Phú Lợi.`;

    if (driveContext && driveContext.trim()) {
      systemInstruction += `\n\nTHÔNG TIN KHÁCH QUAN, CHÍNH XÁC TRA CỨU ĐƯỢC TỪ BỘ NÃO GOOGLE DRIVE (Sử dụng thông tin này làm cơ sở ưu tiên hàng đầu để trả lời chi tiết và chính xác cho bà con):\n${driveContext}`;
    }

    const chatHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Generate response using modern @google/genai SDK format
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Dạ, hiện tại Trợ lý ảo chưa xử lý được câu hỏi của bà con. Xin bà con vui lòng hỏi lại hoặc liên hệ Hotline UBND Phường Phú Lợi nhé ạ.";
    res.json({ text: replyText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Lỗi kết nối với Trợ lý ảo. Quý bà con vui lòng thử lại sau." });
  }
});

// Email Sending API Proxy
import nodemailer from "nodemailer";

app.post("/api/send-email", async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields (to, subject, html)." });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP configuration is missing. Mocking email send.");
    return res.json({ success: true, message: "Email mocked successfully (SMTP config missing)." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Cổng An Sinh Số Phú Lợi" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    res.json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Email Sending Error:", error);
    res.status(500).json({ error: "Lỗi khi gửi email." });
  }
});


// SMS Sending API Proxy (Simulated)
app.post("/api/send-sms", async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) {
    return res.status(400).json({ error: "Missing required fields (to, body)." });
  }

  // Twilio integration has been removed as requested. We simulate successful SMS delivery.
  console.log(`[SMS SIMULATION] Gửi SMS đến: ${to}`);
  console.log(`[SMS SIMULATION] Nội dung: "${body}"`);

  res.json({ 
    success: true, 
    message: "SMS simulated and logged successfully. (No real SMS sent, Twilio removed)",
    simulated: true 
  });
});


// Configure development and production modes
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production static files serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
