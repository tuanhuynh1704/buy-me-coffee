// Danh sách các ngân hàng phổ biến tại Việt Nam hỗ trợ VietQR (Napas247)
const VIETNAM_BANKS = [
  { code: "MB", name: "MBBank - Ngân hàng Quân Đội", bin: "970422", shortName: "MBBank", logo: "🏦" },
  { code: "VCB", name: "Vietcombank - Ngoại thương VN", bin: "970436", shortName: "Vietcombank", logo: "🟢" },
  { code: "TCB", name: "Techcombank - Kỹ thương VN", bin: "970407", shortName: "Techcombank", logo: "🔴" },
  { code: "ICB", name: "VietinBank - Công thương VN", bin: "970415", shortName: "VietinBank", logo: "🔵" },
  { code: "BIDV", name: "BIDV - Đầu tư & Phát triển VN", bin: "970418", shortName: "BIDV", logo: "🔷" },
  { code: "ACB", name: "ACB - Á Châu", bin: "970416", shortName: "ACB", logo: "💎" },
  { code: "VPB", name: "VPBank - Việt Nam Thịnh Vượng", bin: "970432", shortName: "VPBank", logo: "🍀" },
  { code: "TPB", name: "TPBank - Tiên Phong", bin: "970423", shortName: "TPBank", logo: "🟣" },
  { code: "STB", name: "Sacombank - Sài Gòn Thương Tín", bin: "970403", shortName: "Sacombank", logo: "🏛️" },
  { code: "VIB", name: "VIB - Quốc tế Việt Nam", bin: "970441", shortName: "VIB", logo: "⭐" },
  { code: "MSB", name: "MSB - Hàng Hải Việt Nam", bin: "970426", shortName: "MSB", logo: "⛵" },
  { code: "OCB", name: "OCB - Phương Đông", bin: "970448", shortName: "OCB", logo: "🌻" },
  { code: "SEAB", name: "SeABank - Đông Nam Á", bin: "970440", shortName: "SeABank", logo: "🌊" },
  { code: "LPB", name: "LPBank - Lộc Phát Việt Nam", bin: "970449", shortName: "LPBank", logo: "🟡" },
  { code: "SHB", name: "SHB - Sài Gòn - Hà Nội", bin: "970443", shortName: "SHB", logo: "🍊" },
  { code: "HDB", name: "HDBank - Phát triển TP.HCM", bin: "970437", shortName: "HDBank", logo: "🐉" },
  { code: "ABB", name: "ABBank - An Bình", bin: "970425", shortName: "ABBank", logo: "🏢" },
  { code: "NAB", name: "Nam A Bank - Nam Á", bin: "970428", shortName: "Nam A Bank", logo: "🌞" },
  { code: "VIETBANK", name: "VietBank - Việt Nam Thương Tín", bin: "970433", shortName: "VietBank", logo: "🏙️" },
  { code: "BVB", name: "BVBank - Bản Việt", bin: "970454", shortName: "BVBank", logo: "🌿" },
  { code: "CAKE", name: "Cake by VPBank", bin: "546034", shortName: "Cake", logo: "🍰" },
  { code: "TIMO", name: "Timo by BVBank", bin: "963388", shortName: "Timo", logo: "💜" },
  { code: "VTLMONEY", name: "Viettel Money", bin: "971005", shortName: "Viettel Money", logo: "⚡" },
  { code: "VNPTMONEY", name: "VNPT Money", bin: "971011", shortName: "VNPT Money", logo: "🌐" }
];

/**
 * Tạo đường dẫn ảnh VietQR theo chuẩn Napas 247
 * @param {Object} params
 * @param {string} params.bankCode Mã ngân hàng (ví dụ: MB, VCB, TCB)
 * @param {string} params.accountNo Số tài khoản ngân hàng
 * @param {string} params.accountName Tên chủ tài khoản
 * @param {number} params.amount Số tiền cần chuyển (VND)
 * @param {string} params.memo Nội dung chuyển tiền
 * @param {string} params.template Kiểu giao diện QR ('compact', 'compact2', 'qr_only', 'print')
 * @returns {string} URL ảnh VietQR
 */
function generateVietQRUrl({ bankCode, accountNo, accountName, amount, memo, template = "compact2" }) {
  if (!bankCode || !accountNo) return "";
  
  const cleanBank = encodeURIComponent(bankCode.trim());
  const cleanAcc = encodeURIComponent(accountNo.trim());
  let url = `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-${template}.png`;
  
  const queryParams = [];
  if (amount && Number(amount) > 0) {
    queryParams.push(`amount=${encodeURIComponent(Math.round(amount))}`);
  }
  if (memo && memo.trim().length > 0) {
    queryParams.push(`addInfo=${encodeURIComponent(memo.trim())}`);
  }
  if (accountName && accountName.trim().length > 0) {
    queryParams.push(`accountName=${encodeURIComponent(accountName.trim().toUpperCase())}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }
  return url;
}
