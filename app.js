document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wa-form');
  const phoneInput = document.getElementById('phone-number');
  const errorCard = document.getElementById('error-card');
  const errorMessage = document.getElementById('error-message');
  const themeToggle = document.getElementById('theme-toggle');
  
  const historyContainer = document.getElementById('history-container');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const toggleHistoryBtn = document.getElementById('toggle-history-btn');

  // --- Theme Toggle Logic ---
  function getActiveTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  themeToggle.addEventListener('click', () => {
    // Vibrate device for tactile button press if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    const currentTheme = getActiveTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  // Explicitly focus input when app opens
  phoneInput.focus();

  // Function to show error message
  function showError(msg) {
    errorMessage.textContent = msg;
    errorCard.classList.remove('hidden');
    // Vibrate device if supported for tactile feedback of error
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  // Function to hide error message
  function hideError() {
    errorCard.classList.add('hidden');
    errorMessage.textContent = '';
  }

  // Normalize phone number according to rules:
  // - remove spaces
  // - remove symbols
  // - convert 08xxxx into 628xxxx
  function normalizeNumber(numberString) {
    // Remove all non-digit characters
    let cleaned = numberString.replace(/\D/g, '');

    // Convert Indonesian local format (08...) to international format (628...)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }

    return cleaned;
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();

    // Vibrate device for tactile button press if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    const rawValue = phoneInput.value;

    // Validate empty input
    if (!rawValue || rawValue.trim() === '') {
      showError('Silakan masukkan nomor telepon terlebih dahulu.');
      return;
    }

    const normalized = normalizeNumber(rawValue);

    // Validate normalized length (standard international number length is 7 to 15 digits)
    if (!normalized || normalized.length < 7 || normalized.length > 15) {
      showError('Nomor telepon tidak valid. Pastikan format dan panjang nomor sudah benar (minimal 7 digit).');
      return;
    }

    // Redirect to WhatsApp API
    const waUrl = `https://wa.me/${normalized}`;
    saveToHistory(rawValue.trim(), normalized);
    window.location.href = waUrl;
  });

  // Hide error when user type again
  phoneInput.addEventListener('input', () => {
    if (!errorCard.classList.contains('hidden')) {
      hideError();
    }
  });

  // --- History Logic ---
  const HISTORY_KEY = 'wa_history';
  const MAX_HISTORY = 10;
  let isHistoryVisible = false;

  if (toggleHistoryBtn) {
    toggleHistoryBtn.addEventListener('click', () => {
      if ('vibrate' in navigator) navigator.vibrate(30);
      isHistoryVisible = !isHistoryVisible;
      renderHistory();
    });
  }

  function getHistory() {
    const hist = localStorage.getItem(HISTORY_KEY);
    return hist ? JSON.parse(hist) : [];
  }

  function saveToHistory(raw, normalized) {
    let hist = getHistory();
    hist = hist.filter(item => item.normalized !== normalized);
    hist.unshift({ raw, normalized, timestamp: Date.now() });
    if (hist.length > MAX_HISTORY) {
      hist = hist.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    renderHistory();
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }

  function renderHistory() {
    const hist = getHistory();
    
    if (!isHistoryVisible) {
      if (historyContainer) historyContainer.classList.add('hidden');
      return;
    }

    if (historyContainer) historyContainer.classList.remove('hidden');
    if (historyList) historyList.innerHTML = '';

    if (hist.length === 0) {
      const li = document.createElement('li');
      li.style = "padding:16px;text-align:center;font-weight:600;opacity:0.6;";
      li.textContent = "Belum ada riwayat";
      if (historyList) historyList.appendChild(li);
      return;
    }
    
    hist.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      
      const spanNum = document.createElement('span');
      spanNum.className = 'history-number';
      spanNum.textContent = item.raw;
      
      const divIcon = document.createElement('div');
      divIcon.className = 'history-icon';
      divIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      
      li.appendChild(spanNum);
      li.appendChild(divIcon);
      
      li.addEventListener('click', () => {
        if ('vibrate' in navigator) navigator.vibrate(50);
        saveToHistory(item.raw, item.normalized);
        window.location.href = `https://wa.me/${item.normalized}`;
      });
      
      if (historyList) historyList.appendChild(li);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if ('vibrate' in navigator) navigator.vibrate(50);
      clearHistory();
    });
  }

  renderHistory();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
}
