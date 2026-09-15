const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Lỗi cấu hình SMTP Gmail:", error.message);
  } else {
    console.log("✅ Máy chủ sẵn sàng gửi Email qua tài khoản:", process.env.EMAIL_FROM);
  }
});

/**
 * Format currency VND
 */
function formatVND(amount) {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

/**
 * Endpoint: POST /api/notify-donate
 * Nhận thông tin donate từ trang web và gửi thông báo về email
 */
app.post("/api/notify-donate", async (req, res) => {
  try {
    const { donorName, amount, message, timestamp } = req.body;

    const senderName = (donorName && donorName.trim()) ? donorName.trim() : "Người ủng hộ ẩn danh";
    const donateAmount = Number(amount) || 0;
    const donorNote = (message && message.trim()) ? message.trim() : "Không có lời nhắn đi kèm";
    const timeFormatted = timestamp || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const recipientEmail = process.env.EMAIL_TO || process.env.EMAIL_FROM;

    const mailOptions = {
      from: `"Buy Me A Coffee ☕" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: `☕ [Donate Mới] ${senderName} đã tặng bạn ${formatVND(donateAmount)}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .header p { margin: 8px 0 0; opacity: 0.9; font-size: 15px; }
            .content { padding: 28px 24px; }
            .amount-card { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
            .amount-title { font-size: 14px; color: #b45309; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
            .amount-value { font-size: 32px; font-weight: 800; color: #d97706; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
            .info-table td.label { color: #64748b; width: 35%; font-weight: 500; }
            .info-table td.value { color: #0f172a; font-weight: 600; }
            .message-box { background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 24px; }
            .message-label { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 6px; }
            .message-text { font-size: 15px; color: #1e293b; line-height: 1.5; font-style: italic; }
            .footer { text-align: center; font-size: 13px; color: #94a3b8; padding: 16px 24px 24px; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>☕ Bạn Nhận Được Một Donate Mới!</h1>
              <p>Có ai đó vừa gửi tặng bạn một ly cà phê ấm áp</p>
            </div>
            
            <div class="content">
              <div class="amount-card">
                <div class="amount-title">Số tiền ủng hộ</div>
                <div class="amount-value">${formatVND(donateAmount)}</div>
              </div>

              <table class="info-table">
                <tr>
                  <td class="label">👤 Người gửi:</td>
                  <td class="value">${senderName}</td>
                </tr>
                <tr>
                  <td class="label">⏰ Thời gian:</td>
                  <td class="value">${timeFormatted}</td>
                </tr>
                <tr>
                  <td class="label">🏦 Ngân hàng nhận:</td>
                  <td class="value">TPBank - 0754 0025 401 (HUYNH ANH TUAN)</td>
                </tr>
              </table>

              <div class="message-box">
                <div class="message-label">💌 Lời nhắn gửi từ người ủng hộ:</div>
                <div class="message-text">"${donorNote}"</div>
              </div>
            </div>

            <div class="footer">
              <p>Email được gửi tự động từ hệ thống Buy Me A Coffee VietQR.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Đã gửi thông báo email thành công đến ${recipientEmail} cho donate từ: ${senderName}`);

    return res.status(200).json({
      success: true,
      message: "Gửi thông báo donate thành công!"
    });
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể gửi email: " + error.message
    });
  }
});

// Fallback index route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Máy chủ Buy Me A Coffee đang chạy tại: http://localhost:${PORT}`);
});
