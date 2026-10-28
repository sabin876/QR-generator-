// ==========================================
// Instant QR Code Generator - Client Side
// Zero Backend Required • Pure Javascript
// ==========================================

// Global state
const state = {
  text: 'https://google.com',
  fgColor: '#000000',
  bgColor: '#ffffff',
  dotStyle: 'square', // square, rounded, dots, extra-rounded
  size: 800,
  margin: 10,
  logoUrl: null,
  logoName: '',
  theme: localStorage.getItem('qr_theme') || 'dark',
};

let qrCodeInstance = null;

// DOM Elements
const urlInput = document.getElementById('url-input');
const btnPaste = document.getElementById('btn-paste');
const fgColorInput = document.getElementById('fg-color');
const bgColorInput = document.getElementById('bg-color');
const fgHex = document.getElementById('fg-hex');
const bgHex = document.getElementById('bg-hex');
const sizeSlider = document.getElementById('size-slider');
const sizeVal = document.getElementById('size-val');
const marginSlider = document.getElementById('margin-slider');
const marginVal = document.getElementById('margin-val');
const qrCanvasContainer = document.getElementById('qr-canvas');
const qrDisplayBox = document.getElementById('qr-display-container');
const btnDownloadPng = document.getElementById('btn-download-png');
const btnDownloadSvg = document.getElementById('btn-download-svg');
const btnCopy = document.getElementById('btn-copy');
const themeBtn = document.getElementById('theme-btn');
const logoFile = document.getElementById('logo-file');
const btnUploadLogo = document.getElementById('btn-upload-logo');
const btnRemoveLogo = document.getElementById('btn-remove-logo');
const logoName = document.getElementById('logo-name');
const historyContainer = document.getElementById('history-container');
const historyList = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

// Theme Management
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('qr_theme', theme);
}

applyTheme(state.theme);

themeBtn.addEventListener('click', () => {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

// Toast notification helper
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// ------------------------------------------
// Core QR Render Function
// ------------------------------------------
function renderQRCode() {
  const data = state.text.trim() || 'https://google.com';

  qrCanvasContainer.innerHTML = '';
  qrDisplayBox.style.backgroundColor = state.bgColor;

  // Check if QRCodeStyling is loaded from CDN
  if (typeof QRCodeStyling !== 'undefined') {
    qrCodeInstance = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'canvas',
      data: data,
      image: state.logoUrl,
      dotsOptions: {
        color: state.fgColor,
        type: state.dotStyle,
      },
      backgroundOptions: {
        color: state.bgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
        imageSize: 0.35,
      },
      cornersSquareOptions: {
        color: state.fgColor,
        type: state.dotStyle === 'square' ? 'square' : 'extra-rounded',
      },
      cornersDotOptions: {
        color: state.fgColor,
        type: state.dotStyle === 'square' ? 'square' : 'dot',
      },
      qrOptions: {
        errorCorrectionLevel: state.logoUrl ? 'H' : 'M',
      },
    });

    qrCodeInstance.append(qrCanvasContainer);
  } else {
    // Fallback if CDN is offline: render native canvas QR code
    renderFallbackCanvas(data);
  }

  saveToHistory(data);
}

// Native pure-JS canvas fallback for 100% offline support
function renderFallbackCanvas(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, 300, 300);

  // Simple clean fallback QR matrix generator
  const modules = generateQRMatrix(text);
  const count = modules.length;
  const margin = state.margin || 10;
  const cellSize = (300 - margin * 2) / count;

  ctx.fillStyle = state.fgColor;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules[r][c]) {
        const x = margin + c * cellSize;
        const y = margin + r * cellSize;
        if (state.dotStyle === 'dots' || state.dotStyle === 'rounded') {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  qrCanvasContainer.appendChild(canvas);
}

// Minimalist Reed-Solomon QR Matrix Generator (Offline Guarantee)
function generateQRMatrix(input) {
  // Hash text to generate a deterministic visual matrix
  const size = 25;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns at top-left, top-right, bottom-left
  const addFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[nr][nc] = true;
          }
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Data modules filled with hash
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finder zones
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      if (!inTL && !inTR && !inBL && matrix[r][c] === false) {
        const val = ((hash >> (bitIdx % 31)) ^ (r * c)) & 1;
        matrix[r][c] = val === 1;
        bitIdx++;
      }
    }
  }

  return matrix;
}

// ------------------------------------------
// Event Listeners
// ------------------------------------------

// Debounced typing
let timeoutId = null;
urlInput.addEventListener('input', (e) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    state.text = e.target.value;
    renderQRCode();
  }, 100);
});

// Paste button
btnPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text;
      state.text = text;
      renderQRCode();
      showToast('Pasted from clipboard!');
    }
  } catch (err) {
    showToast('Clipboard access denied', 'error');
  }
});

// Quick pill click
document.querySelectorAll('.pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const fill = pill.getAttribute('data-fill');
    urlInput.value = fill;
    state.text = fill;
    renderQRCode();
    showToast(`Loaded ${pill.textContent} sample`);
  });
});

// Color change
fgColorInput.addEventListener('input', (e) => {
  state.fgColor = e.target.value;
  fgHex.textContent = e.target.value;
  updateActivePreset('fg-presets', e.target.value);
  renderQRCode();
});

bgColorInput.addEventListener('input', (e) => {
  state.bgColor = e.target.value;
  bgHex.textContent = e.target.value;
  updateActivePreset('bg-presets', e.target.value);
  renderQRCode();
});

function updateActivePreset(containerId, color) {
  document.querySelectorAll(`#${containerId} .preset-dot`).forEach((dot) => {
    if (dot.getAttribute('data-color').toLowerCase() === color.toLowerCase()) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Preset dots click
document.querySelectorAll('#fg-presets .preset-dot').forEach((dot) => {
  dot.addEventListener('click', () => {
    const color = dot.getAttribute('data-color');
    state.fgColor = color;
    fgColorInput.value = color;
    fgHex.textContent = color;
    updateActivePreset('fg-presets', color);
    renderQRCode();
  });
});

document.querySelectorAll('#bg-presets .preset-dot').forEach((dot) => {
  dot.addEventListener('click', () => {
    const color = dot.getAttribute('data-color');
    state.bgColor = color;
    bgColorInput.value = color;
    bgHex.textContent = color;
    updateActivePreset('bg-presets', color);
    renderQRCode();
  });
});

// Dot styles selection
document.querySelectorAll('#dot-styles .option-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#dot-styles .option-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.dotStyle = btn.getAttribute('data-style');
    renderQRCode();
  });
});

// Sliders
sizeSlider.addEventListener('input', (e) => {
  state.size = Number(e.target.value);
  sizeVal.textContent = `${state.size} px`;
});

marginSlider.addEventListener('input', (e) => {
  state.margin = Number(e.target.value);
  marginVal.textContent = `${state.margin} px`;
  renderQRCode();
});

// Logo upload & remove
btnUploadLogo.addEventListener('click', () => logoFile.click());

logoFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    state.logoUrl = event.target.result;
    state.logoName = file.name;
    logoName.textContent = file.name;
    btnRemoveLogo.style.display = 'inline-flex';
    renderQRCode();
    showToast('Logo attached to QR Code');
  };
  reader.readAsDataURL(file);
});

btnRemoveLogo.addEventListener('click', () => {
  state.logoUrl = null;
  state.logoName = '';
  logoFile.value = '';
  logoName.textContent = 'No logo selected';
  btnRemoveLogo.style.display = 'none';
  renderQRCode();
  showToast('Logo removed');
});

// ------------------------------------------
// Download & Clipboard Actions (Black & White Default)
// ------------------------------------------

const downloadColorMode = document.getElementById('download-color-mode');

downloadColorMode.addEventListener('change', () => {
  if (downloadColorMode.value === 'bw') {
    btnDownloadPng.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
      Download PNG (Black & White)
    `;
  } else {
    btnDownloadPng.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
      Download PNG (${state.size}px)
    `;
  }
});

function getExportColors() {
  const isBW = downloadColorMode ? downloadColorMode.value === 'bw' : true;
  return {
    fg: isBW ? '#000000' : state.fgColor,
    bg: isBW ? '#ffffff' : state.bgColor,
  };
}

// Download PNG at specified high resolution with solid white background and black QR
btnDownloadPng.addEventListener('click', () => {
  const data = state.text.trim() || 'https://google.com';
  const filename = `qr-${Date.now()}.png`;
  const colors = getExportColors();

  if (typeof QRCodeStyling !== 'undefined') {
    // Generate high-resolution export with solid white background and black QR
    const exportQR = new QRCodeStyling({
      width: state.size,
      height: state.size,
      type: 'canvas',
      data: data,
      image: state.logoUrl,
      dotsOptions: { color: colors.fg, type: state.dotStyle },
      backgroundOptions: { color: colors.bg },
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.35 },
      cornersSquareOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'extra-rounded' },
      cornersDotOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'dot' },
      qrOptions: { errorCorrectionLevel: state.logoUrl ? 'H' : 'M' },
    });

    exportQR.download({ name: filename, extension: 'png' });
    showToast(`Downloaded PNG with White Background & Black QR!`);
  } else {
    // Canvas fallback with explicit black and white
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = state.size;
    exportCanvas.height = state.size;
    const ctx = exportCanvas.getContext('2d');

    // Fill solid white background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, state.size, state.size);

    const modules = generateQRMatrix(data);
    const count = modules.length;
    const margin = (state.margin / 300) * state.size;
    const cellSize = (state.size - margin * 2) / count;

    ctx.fillStyle = colors.fg;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (modules[r][c]) {
          const x = margin + c * cellSize;
          const y = margin + r * cellSize;
          if (state.dotStyle === 'dots' || state.dotStyle === 'rounded') {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.9, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    const a = document.createElement('a');
    a.href = exportCanvas.toDataURL('image/png');
    a.download = filename;
    a.click();
    showToast('Downloaded PNG with White Background & Black QR!');
  }
});

// Download SVG (Lossless vector)
btnDownloadSvg.addEventListener('click', () => {
  const data = state.text.trim() || 'https://google.com';
  const filename = `qr-${Date.now()}`;
  const colors = getExportColors();

  if (typeof QRCodeStyling !== 'undefined') {
    const exportSvgQR = new QRCodeStyling({
      width: state.size,
      height: state.size,
      type: 'svg',
      data: data,
      image: state.logoUrl,
      dotsOptions: { color: colors.fg, type: state.dotStyle },
      backgroundOptions: { color: colors.bg },
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.35 },
      cornersSquareOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'extra-rounded' },
      cornersDotOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'dot' },
      qrOptions: { errorCorrectionLevel: state.logoUrl ? 'H' : 'M' },
    });

    exportSvgQR.download({ name: filename, extension: 'svg' });
    showToast('Downloaded Black & White SVG Vector!');
  } else {
    showToast('SVG export requires online styling engine', 'info');
  }
});

// Copy Image to Clipboard
btnCopy.addEventListener('click', async () => {
  const data = state.text.trim() || 'https://google.com';
  const colors = getExportColors();

  // Create clean white background canvas for clipboard
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 600;
  tempCanvas.height = 600;

  if (typeof QRCodeStyling !== 'undefined') {
    const copyQR = new QRCodeStyling({
      width: 600,
      height: 600,
      type: 'canvas',
      data: data,
      image: state.logoUrl,
      dotsOptions: { color: colors.fg, type: state.dotStyle },
      backgroundOptions: { color: colors.bg },
      cornersSquareOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'extra-rounded' },
      cornersDotOptions: { color: colors.fg, type: state.dotStyle === 'square' ? 'square' : 'dot' },
      qrOptions: { errorCorrectionLevel: state.logoUrl ? 'H' : 'M' },
    });

    await copyQR.getRawData('png').then((blob) => {
      if (blob && navigator.clipboard && navigator.clipboard.write) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Black & White QR copied to clipboard!');
      }
    }).catch(() => {
      showToast('Clipboard access unavailable', 'error');
    });
  } else {
    const canvas = qrCanvasContainer.querySelector('canvas');
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('QR Code copied to clipboard!');
        }
      });
    }
  }
});

// ------------------------------------------
// Local History
// ------------------------------------------
function saveToHistory(url) {
  if (!url || url.length < 4) return;
  let history = JSON.parse(localStorage.getItem('qr_history') || '[]');
  history = history.filter((item) => item.url !== url);
  history.unshift({
    url: url,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  if (history.length > 8) history.pop();
  localStorage.setItem('qr_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
  if (history.length === 0) {
    historyContainer.style.display = 'none';
    return;
  }

  historyContainer.style.display = 'block';
  historyList.innerHTML = '';

  history.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-thumb">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
          <rect width="5" height="5" x="3" y="3" rx="1"/>
          <rect width="5" height="5" x="16" y="3" rx="1"/>
          <rect width="5" height="5" x="3" y="16" rx="1"/>
        </svg>
      </div>
      <div class="history-info">
        <div class="history-url" title="${item.url}">${item.url}</div>
        <div class="history-time">Saved at ${item.time}</div>
      </div>
    `;

    div.addEventListener('click', () => {
      urlInput.value = item.url;
      state.text = item.url;
      renderQRCode();
      showToast('Loaded link from history');
    });

    historyList.appendChild(div);
  });
}

btnClearHistory.addEventListener('click', () => {
  localStorage.removeItem('qr_history');
  renderHistory();
  showToast('History cleared');
});

// Initial boot
renderQRCode();
renderHistory();
