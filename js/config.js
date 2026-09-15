/**
 * File cấu hình mặc định thông tin nhận Donate
 * Người dùng có thể chỉnh sửa trực tiếp tệp này hoặc chỉnh sửa trực quan qua nút "Cài đặt" trên trang web.
 */
const DEFAULT_CONFIG = {
  // Thông tin cá nhân hiển thị
  receiverName: "Huỳnh Anh Tuấn",
  title: "Tặng mình một ly cà phê ☕",
  subtitle: "Cảm ơn bạn đã ghé thăm và ủng hộ những dự án sáng tạo của mình!",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=tuanhuynh&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
  
  // Thông tin tài khoản ngân hàng nhận tiền
  bankCode: "TPB",                      // TPBank
  bankName: "TPBank (Tiên Phong Bank)", // Tên hiển thị ngân hàng
  accountNo: "07540025401",             // Số tài khoản ngân hàng
  accountName: "HUYNH ANH TUAN",        // Tên chủ tài khoản
  
  // Thiết lập mặc định
  defaultAmount: 25000,                 // Mức donate mặc định (1 ly cà phê = 25.000đ)
  defaultMemoPrefix: "Donate Coffee",   // Tiền tố nội dung chuyển khoản
  
  // Sử dụng trực tiếp ảnh QR có sẵn của bạn
  qrMode: "static",
  staticQrImage: "./QR-nhan-donate.png",
  
  // Danh sách các gói donate nhanh
  presets: [
    { cups: 1, amount: 25000, label: "1 Ly Cà Phê ☕", emoji: "☕" },
    { cups: 2, amount: 50000, label: "2 Ly Cà Phê ☕☕", emoji: "☕☕" },
    { cups: 3, amount: 75000, label: "3 Ly Cà Phê ☕☕☕", emoji: "☕☕☕" },
    { cups: 5, amount: 100000, label: "Bữa Sáng 🥐", emoji: "🥐" },
    { cups: 10, amount: 200000, label: "Gói Động Lực 🔥", emoji: "🚀" }
  ],
  
  // Liên kết mạng xã hội (tùy chọn)
  socials: {
    facebook: "https://facebook.com",
    github: "https://github.com",
    telegram: "https://t.me"
  }
};

const CONFIG_STORAGE_KEY = "DONATE_PAGE_CONFIG_TPB_V1";

/**
 * Lấy cấu hình hiện tại (ưu tiên localStorage, fallback về DEFAULT_CONFIG)
 */
function getActiveConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Không thể tải cấu hình từ localStorage:", e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Lưu cấu hình vào localStorage
 */
function saveActiveConfig(newConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    return true;
  } catch (e) {
    console.error("Lỗi khi lưu cấu hình:", e);
    return false;
  }
}

/**
 * Khôi phục cấu hình về mặc định
 */
function resetActiveConfig() {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
