/**
 * BUY ME A COFFEE - VIETQR DONATION ENGINE
 * Core Application Logic
 */

// Global State
let currentConfig = {};
let selectedAmount = 25000;
let qrDebounceTimer = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadConfig();
  populateBankSelect();
  renderPresets();
  bindEvents();
  updateQrCode();
});

/* =========================================================
   1. CONFIG & THEME MANAGEMENT
   ========================================================= */

function initTheme() {
  const savedTheme = localStorage.getItem("DONATE_PAGE_THEME") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const target = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", target);
  localStorage.setItem("DONATE_PAGE_THEME", target);
  updateThemeIcon(target);
  showToast(target === "dark" ? "Đã bật giao diện Tối 🌙" : "Đã bật giao diện Sáng ☀️");
}

function updateThemeIcon(theme) {
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.innerHTML = theme === "dark" ? "☀️" : "🌙";
    themeBtn.setAttribute("title", theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối");
  }
}

function loadConfig() {
  currentConfig = getActiveConfig();
  selectedAmount = currentConfig.defaultAmount || 25000;
  
  // Update Profile UI
  document.getElementById("profile-name").textContent = currentConfig.receiverName;
  document.getElementById("profile-subtitle").textContent = currentConfig.subtitle;
  document.getElementById("profile-avatar").src = currentConfig.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=coffee";
  document.getElementById("app-title").textContent = currentConfig.title;

  // Update Detail Texts
  document.getElementById("display-bank-name").textContent = currentConfig.bankName || currentConfig.bankCode;
  document.getElementById("display-acc-no").textContent = currentConfig.accountNo;
  document.getElementById("display-acc-name").textContent = currentConfig.accountName;
  
  // Fill Settings form if opened
  populateSettingsForm();
}

/* =========================================================
   2. PRESET AMOUNTS & FORM HANDLING
   ========================================================= */

function renderPresets() {
  const container = document.getElementById("presets-container");
  if (!container) return;
  container.innerHTML = "";

  currentConfig.presets.forEach((preset, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-btn ${preset.amount === selectedAmount ? "active" : ""}`;
    btn.innerHTML = `
      <span class="preset-emoji">${preset.emoji || "☕"}</span>
      <span class="preset-amount">${formatCurrency(preset.amount)}</span>
      <span class="preset-label">${preset.label}</span>
    `;
    btn.addEventListener("click", () => {
      selectAmount(preset.amount, btn);
    });
    container.appendChild(btn);
  });
}

function selectAmount(amount, buttonElement) {
  selectedAmount = Number(amount);
  
  // Update active state in preset buttons
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  if (buttonElement) {
    buttonElement.classList.add("active");
  }

  // Clear custom amount input if matching a preset
  const customInput = document.getElementById("custom-amount-input");
  if (customInput) {
    customInput.value = formatNumber(selectedAmount);
  }

  updateTransferDetails();
  triggerQrUpdate();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatNumber(num) {
  if (!num) return "";
  return Number(num).toLocaleString("vi-VN");
}

function parseFormattedNumber(str) {
  return Number(String(str).replace(/[^0-9]/g, "")) || 0;
}

/* =========================================================
   3. QR CODE GENERATION & DETAILS
   ========================================================= */

function getMemoString() {
  const donorName = (document.getElementById("donor-name")?.value || "").trim();
  const donorNote = (document.getElementById("donor-message")?.value || "").trim();
  
  let memoParts = [];
  if (currentConfig.defaultMemoPrefix) {
    memoParts.push(currentConfig.defaultMemoPrefix);
  }
  if (donorName) {
    memoParts.push(donorName);
  }
  if (donorNote) {
    memoParts.push(donorNote);
  }
  
  // VietQR recommend short ascii memo (max ~50 chars)
  const fullMemo = memoParts.join(" - ");
  return removeVietnameseTones(fullMemo).substring(0, 50);
}

function updateTransferDetails() {
  const displayAmount = document.getElementById("display-amount");
  const displayMemo = document.getElementById("display-memo");
  
  if (displayAmount) {
    displayAmount.textContent = formatCurrency(selectedAmount);
  }
  if (displayMemo) {
    displayMemo.textContent = getMemoString() || "Donate";
  }
}

function triggerQrUpdate() {
  clearTimeout(qrDebounceTimer);
  qrDebounceTimer = setTimeout(() => {
    updateQrCode();
  }, 350);
}

function updateQrCode() {
  const qrImg = document.getElementById("qr-code-img");
  const spinner = document.getElementById("qr-spinner");
  if (!qrImg) return;

  const mode = currentConfig.qrMode || "vietqr";

  if (mode === "static" && currentConfig.staticQrImage) {
    qrImg.src = currentConfig.staticQrImage;
    if (spinner) spinner.style.display = "none";
    updateTransferDetails();
    return;
  }

  if (spinner) spinner.style.display = "block";
  qrImg.style.opacity = "0.4";

  const memo = getMemoString();
  const qrUrl = generateVietQRUrl({
    bankCode: currentConfig.bankCode,
    accountNo: currentConfig.accountNo,
    accountName: currentConfig.accountName,
    amount: selectedAmount,
    memo: memo,
    template: "compact2"
  });

  const tempImg = new Image();
  tempImg.onload = () => {
    qrImg.src = qrUrl;
    qrImg.style.opacity = "1";
    if (spinner) spinner.style.display = "none";
  };
  tempImg.onerror = () => {
    // Fallback to static or direct QR
    qrImg.src = currentConfig.staticQrImage || qrUrl;
    qrImg.style.opacity = "1";
    if (spinner) spinner.style.display = "none";
  };
  tempImg.src = qrUrl;

  updateTransferDetails();
}

/* =========================================================
   4. COPY & DOWNLOAD ACTIONS
   ========================================================= */

function copyToClipboard(text, successMsg = "Đã sao chép thành công!") {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
      triggerConfetti();
    }).catch(() => {
      fallbackCopyTextToClipboard(text, successMsg);
    });
  } else {
    fallbackCopyTextToClipboard(text, successMsg);
  }
}

function fallbackCopyTextToClipboard(text, successMsg) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
    triggerConfetti();
  } catch (err) {
    showToast("Không thể sao chép, vui lòng sao chép thủ công", "error");
  }
  document.body.removeChild(textArea);
}

function downloadQr() {
  const qrImg = document.getElementById("qr-code-img");
  if (!qrImg || !qrImg.src) return;

  showToast("Đang tải mã QR về máy...");

  fetch(qrImg.src)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `VietQR-Donate-${currentConfig.receiverName || "Coffee"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Tải ảnh QR thành công! 🎉");
    })
    .catch(() => {
      // Fallback open in new tab
      window.open(qrImg.src, "_blank");
    });
}

/* =========================================================
   5. TOAST & CELEBRATION CONFETTI
   ========================================================= */

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = type === "error" ? "❌" : "✨";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-leave");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#f59e0b", "#ea580c", "#fbbf24", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"];

  for (let i = 0; i < 65; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + 50,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 14,
      dy: (Math.random() - 0.7) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      if (p.alpha > 0) {
        alive = true;
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.35; // gravity
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(render);
}

/* =========================================================
   6. SETTINGS MODAL & BANK SELECT
   ========================================================= */

function populateBankSelect() {
  const select = document.getElementById("setting-bank");
  if (!select) return;
  select.innerHTML = "";

  VIETNAM_BANKS.forEach(bank => {
    const opt = document.createElement("option");
    opt.value = bank.code;
    opt.textContent = `${bank.logo} ${bank.shortName} (${bank.code})`;
    select.appendChild(opt);
  });
}

function openSettingsModal() {
  populateSettingsForm();
  document.getElementById("settings-modal").classList.add("active");
}

function closeSettingsModal() {
  document.getElementById("settings-modal").classList.remove("active");
}

function populateSettingsForm() {
  const form = document.getElementById("settings-form");
  if (!form) return;

  document.getElementById("setting-name").value = currentConfig.receiverName || "";
  document.getElementById("setting-title").value = currentConfig.title || "";
  document.getElementById("setting-subtitle").value = currentConfig.subtitle || "";
  document.getElementById("setting-avatar").value = currentConfig.avatarUrl || "";
  document.getElementById("setting-bank").value = currentConfig.bankCode || "MB";
  document.getElementById("setting-acc-no").value = currentConfig.accountNo || "";
  document.getElementById("setting-acc-name").value = currentConfig.accountName || "";
  document.getElementById("setting-qr-mode").value = currentConfig.qrMode || "vietqr";
}

function handleSaveSettings(e) {
  e.preventDefault();
  
  const bankCode = document.getElementById("setting-bank").value;
  const bankObj = VIETNAM_BANKS.find(b => b.code === bankCode);

  const updatedConfig = {
    ...currentConfig,
    receiverName: document.getElementById("setting-name").value.trim(),
    title: document.getElementById("setting-title").value.trim(),
    subtitle: document.getElementById("setting-subtitle").value.trim(),
    avatarUrl: document.getElementById("setting-avatar").value.trim(),
    bankCode: bankCode,
    bankName: bankObj ? `${bankObj.shortName} (${bankObj.code})` : bankCode,
    accountNo: document.getElementById("setting-acc-no").value.trim(),
    accountName: document.getElementById("setting-acc-name").value.trim().toUpperCase(),
    qrMode: document.getElementById("setting-qr-mode").value
  };

  saveActiveConfig(updatedConfig);
  loadConfig();
  updateQrCode();
  closeSettingsModal();
  showToast("Cập nhật thông tin nhận tiền thành công! 🎉");
}

function handleResetSettings() {
  if (confirm("Bạn có chắc chắn muốn khôi phục thông tin cấu hình ban đầu?")) {
    resetActiveConfig();
    loadConfig();
    updateQrCode();
    closeSettingsModal();
    showToast("Đã khôi phục cài đặt mặc định!");
  }
}

/* =========================================================
   7. EVENT BINDINGS & HELPERS
   ========================================================= */

function bindEvents() {
  // Theme Toggle
  document.getElementById("theme-toggle-btn")?.addEventListener("click", toggleTheme);

  // Settings Modal
  document.getElementById("settings-btn")?.addEventListener("click", openSettingsModal);
  document.getElementById("close-settings-btn")?.addEventListener("click", closeSettingsModal);
  document.getElementById("settings-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "settings-modal") closeSettingsModal();
  });
  document.getElementById("settings-form")?.addEventListener("submit", handleSaveSettings);
  document.getElementById("reset-settings-btn")?.addEventListener("click", handleResetSettings);

  // Custom Amount Input
  const customAmountInput = document.getElementById("custom-amount-input");
  if (customAmountInput) {
    customAmountInput.addEventListener("input", (e) => {
      const raw = parseFormattedNumber(e.target.value);
      selectedAmount = raw;
      e.target.value = raw > 0 ? formatNumber(raw) : "";
      
      // Uncheck preset buttons if custom
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      
      updateTransferDetails();
      triggerQrUpdate();
    });
  }

  // Donor Name & Message
  document.getElementById("donor-name")?.addEventListener("input", () => {
    updateTransferDetails();
    triggerQrUpdate();
  });
  document.getElementById("donor-message")?.addEventListener("input", () => {
    updateTransferDetails();
    triggerQrUpdate();
  });

  // Copy Action Buttons
  document.getElementById("copy-acc-btn")?.addEventListener("click", () => {
    copyToClipboard(currentConfig.accountNo, `Đã chép STK: ${currentConfig.accountNo}`);
  });
  document.getElementById("copy-memo-btn")?.addEventListener("click", () => {
    const memo = document.getElementById("display-memo")?.textContent || "Donate";
    copyToClipboard(memo, `Đã chép nội dung: "${memo}"`);
  });
  document.getElementById("copy-all-btn")?.addEventListener("click", () => {
    const memo = document.getElementById("display-memo")?.textContent || "Donate";
    const fullInfo = `Ngân hàng: ${currentConfig.bankName}\nSTK: ${currentConfig.accountNo}\nChủ TK: ${currentConfig.accountName}\nSố tiền: ${formatCurrency(selectedAmount)}\nNội dung: ${memo}`;
    copyToClipboard(fullInfo, "Đã sao chép toàn bộ thông tin chuyển khoản!");
  });

  // Download QR Button
  document.getElementById("download-qr-btn")?.addEventListener("click", downloadQr);

  // Send Donate Email Notification Button
  document.getElementById("send-donate-notify-btn")?.addEventListener("click", handleSendDonationNotification);
}

/**
 * Gửi thông báo donate & lời nhắn đến Email người nhận
 */
async function handleSendDonationNotification() {
  const btn = document.getElementById("send-donate-notify-btn");
  const btnIcon = btn?.querySelector(".btn-icon");
  const btnText = btn?.querySelector(".btn-text");
  const btnSpinner = btn?.querySelector(".btn-spinner");

  const donorName = (document.getElementById("donor-name")?.value || "").trim();
  const donorMessage = (document.getElementById("donor-message")?.value || "").trim();

  // Validate amount
  if (!selectedAmount || selectedAmount <= 0) {
    showToast("Vui lòng chọn hoặc nhập số tiền ủng hộ!", "error");
    return;
  }

  // Set loading state
  if (btn) {
    btn.disabled = true;
    if (btnIcon) btnIcon.style.display = "none";
    if (btnSpinner) btnSpinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Đang gửi thông báo đến hòm thư...";
  }

  const isGitHubPages = window.location.hostname.includes("github.io");
  const localEndpoint = (window.location.protocol === "http:" || window.location.protocol === "https:")
    ? "/api/notify-donate"
    : "http://localhost:5000/api/notify-donate";

  const timeNow = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  try {
    let success = false;

    // 1. Thử gửi qua Server Node.js nội bộ trước (nếu không phải trên github.io)
    if (!isGitHubPages) {
      try {
        const response = await fetch(localEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorName: donorName,
            amount: selectedAmount,
            message: donorMessage,
            timestamp: timeNow
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) success = true;
        }
      } catch (localErr) {
        console.log("Không kết nối được server local, chuyển sang phương thức gửi Cloud...");
      }
    }

    // 2. Nếu chạy trên GitHub Pages hoặc Server local không bật, gửi qua FormSubmit Cloud miễn phí
    if (!success) {
      const recipientEmail = "tuanhuynh170424@gmail.com";
      const cloudResponse = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          _subject: `☕ [Donate Mới] ${donorName || "Người ủng hộ"} đã tặng bạn ${formatCurrency(selectedAmount)}!`,
          "Tên người gửi": donorName || "Ẩn danh",
          "Số tiền donate": formatCurrency(selectedAmount),
          "Lời nhắn": donorMessage || "Không có lời nhắn",
          "Tài khoản thụ hưởng": `${currentConfig.bankName} - ${currentConfig.accountNo} (${currentConfig.accountName})`,
          "Thời gian": timeNow,
          _template: "table"
        })
      });

      if (cloudResponse.ok) {
        success = true;
      } else {
        throw new Error("Không thể gửi email qua Cloud");
      }
    }

    if (success) {
      showToast("Đã gửi lời nhắn và thông báo donate đến email! 💌🎉");
      triggerConfetti();
      
      // Reset donor fields
      const messageInput = document.getElementById("donor-message");
      if (messageInput) messageInput.value = "";
    } else {
      throw new Error("Gửi email không thành công");
    }
  } catch (error) {
    console.error("Lỗi khi gửi email thông báo:", error);
    showToast("Đã ghi nhận lời nhắn của bạn! Cảm ơn bạn rất nhiều ❤️");
    triggerConfetti();
  } finally {
    // Reset button state
    if (btn) {
      btn.disabled = false;
      if (btnIcon) btnIcon.style.display = "inline-block";
      if (btnSpinner) btnSpinner.style.display = "none";
      if (btnText) btnText.textContent = "Gửi lời nhắn & Thông báo đã donate";
    }
  }
}

function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}
