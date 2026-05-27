document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wa-form');
  const phoneInput = document.getElementById('phone-number');
  const pasteBtn = document.getElementById('paste-btn');
  const errorCard = document.getElementById('error-card');
  const errorMessage = document.getElementById('error-message');

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

  // Paste action from Clipboard API
  pasteBtn.addEventListener('click', async () => {
    // Vibrate device for tactile button press if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showError('Clipboard API tidak didukung pada browser Anda. Silakan tempel secara manual.');
        return;
      }

      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();

      if (trimmedText) {
        phoneInput.value = trimmedText;
        hideError();
        phoneInput.focus();
      } else {
        showError('Clipboard kosong. Silakan salin nomor terlebih dahulu.');
      }
    } catch (err) {
      console.warn('Clipboard read failed: ', err);
      showError('Gagal mengakses clipboard. Izinkan akses clipboard atau tempel nomor secara manual.');
    }
  });

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
    window.location.href = waUrl;
  });

  // Hide error when user type again
  phoneInput.addEventListener('input', () => {
    if (!errorCard.classList.contains('hidden')) {
      hideError();
    }
  });
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
