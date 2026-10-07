/**
 * Personal Finance Dashboard - Application Core
 * Vanilla JavaScript (ES Module) with Firebase Web SDK v10 (modular)
 */

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Predefined allowed categories
const ALLOWED_CATEGORIES = [
  'Food & Dining',
  'Rent & Utilities',
  'Salary & Invoices',
  'Entertainment',
  'Transport',
  'Shopping',
  'Miscellaneous'
];

// ===============================================================
// APPLICATION STATE
// ===============================================================
let auth = null;
let db = null;
let currentUser = null;
let unsubscribeTransactions = null;
let allTransactions = []; // Always starts empty: zero balance, zero transactions
let activeFilterType = 'ALL'; // 'ALL' | 'income' | 'expense'
let activeFilterCategory = 'ALL'; // 'ALL' | category string
let activeSearchQuery = '';
let currentEditingId = null;
let itemToDelete = null;
let isWriteInProgress = false;

// Category visual metadata (icons & styling)
const CATEGORY_META = {
  'Food & Dining': {
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: `<svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 18m0 0v-5.25A2.25 2.25 0 0 1 5.25 10.5h13.5A2.25 2.25 0 0 1 21 12.75V18" /></svg>`
  },
  'Rent & Utilities': {
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: `<svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`
  },
  'Salary & Invoices': {
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: `<svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0H3m-1.5 6h1.5m-1.5 6H3m16.5-12h.75a.75.75 0 0 1 .75.75v.75m0 0H21m0 6h.75a.75.75 0 0 1 .75.75v.75m0 0H21m0 6h.75a.75.75 0 0 1 .75.75v.75m0 0H21M6.75 7.5h10.5a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25v-4.5a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>`
  },
  'Entertainment': {
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: `<svg class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`
  },
  'Transport': {
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: `<svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-19.5 0v-4.5c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v4.5m-16.5 0h16.5" /></svg>`
  },
  'Shopping': {
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    icon: `<svg class="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>`
  },
  'Miscellaneous': {
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: `<svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`
  }
};

// ===============================================================
// UTILITIES & FORMATTING
// ===============================================================

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the user's LOCAL timezone.
 */
function getLocalTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a 'YYYY-MM-DD' date string into a user-friendly local date (e.g. 'Oct 7, 2026').
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats integer cents into standard USD currency string (e.g. $1,200.00).
 */
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatCurrency(cents) {
  return currencyFormatter.format(cents / 100);
}

/**
 * Sanitizes spreadsheet cells against formula injection attacks (=, +, -, @).
 */
function sanitizeCsvCell(value) {
  const str = String(value ?? '');
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  let safeStr = str;
  if (dangerousPrefixes.some(prefix => str.startsWith(prefix))) {
    safeStr = "'" + str;
  }
  // Escape double quotes
  return `"${safeStr.replace(/"/g, '""')}"`;
}

/**
 * Translates Firebase error codes into friendly human-readable messages.
 */
function getFriendlyAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please log in or reset your password.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily locked for security. Please try again later or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in your Firebase console. Please enable Email/Password or Google under Authentication.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires a recent login. Please log in again.';
    default:
      return 'An error occurred during authentication. Please check your details and try again.';
  }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium transition-all transform duration-200 translate-y-2 opacity-0';

  let bgClass = 'bg-slate-900 text-white border-slate-800';
  let iconSvg = '';

  if (type === 'success') {
    bgClass = 'bg-emerald-900 text-emerald-100 border-emerald-800';
    iconSvg = `<svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`;
  } else if (type === 'error') {
    bgClass = 'bg-rose-900 text-rose-100 border-rose-800';
    iconSvg = `<svg class="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>`;
  } else {
    iconSvg = `<svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`;
  }

  toast.className += ` ${bgClass}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'flex items-center gap-2.5';
  contentDiv.innerHTML = iconSvg;

  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  contentDiv.appendChild(textSpan);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.className = 'text-white/60 hover:text-white flex-shrink-0 ml-2 focus:outline-none';
  closeBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;

  toast.appendChild(contentDiv);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  const dismiss = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, 4000);
}

// ===============================================================
// VIEW SWITCHER & MODAL HELPERS
// ===============================================================
function showScreen(screenId) {
  const screens = ['screen-loading', 'screen-setup-required', 'screen-auth', 'screen-dashboard'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === screenId) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  const firstInput = modal.querySelector('input:not([disabled]), button:not([disabled])');
  if (firstInput) firstInput.focus();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
}

// Global modal close on Escape key and background click
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['modal-clear-all', 'modal-delete-item', 'modal-forgot-password'].forEach(closeModal);
  }
});

['modal-clear-all', 'modal-delete-item', 'modal-forgot-password'].forEach(modalId => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modalId);
    });
  }
});

// ===============================================================
// FIREBASE INITIALIZATION
// ===============================================================
async function initApp() {
  // 1. Check if Firebase config is configured
  if (!isFirebaseConfigured()) {
    showScreen('screen-setup-required');
    const reloadBtn = document.getElementById('btn-reload-config');
    if (reloadBtn) reloadBtn.addEventListener('click', () => window.location.reload());
    return;
  }

  try {
    // Dynamically import Firebase SDK modular packages
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const {
      getAuth,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      updateProfile,
      sendPasswordResetEmail,
      GoogleAuthProvider,
      signInWithPopup
    } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    const {
      initializeFirestore,
      persistentLocalCache,
      persistentMultipleTabManager,
      getFirestore,
      collection,
      doc,
      addDoc,
      updateDoc,
      deleteDoc,
      writeBatch,
      getDocs,
      onSnapshot,
      serverTimestamp
    } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Initialize Firestore with IndexedDB offline persistence
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (cacheErr) {
      // Fallback gracefully without throwing
      db = getFirestore(app);
    }

    // Bind Auth & UI Event Handlers
    setupAuthListeners({
      auth,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      updateProfile,
      sendPasswordResetEmail,
      GoogleAuthProvider,
      signInWithPopup
    });

    setupDashboardListeners({
      db,
      collection,
      doc,
      addDoc,
      updateDoc,
      deleteDoc,
      writeBatch,
      getDocs,
      serverTimestamp
    });

    // Listen to Firebase Auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user;
        updateUserHeader(user);
        showScreen('screen-dashboard');
        startFirestoreListener({ db, collection, onSnapshot, uid: user.uid });
      } else {
        currentUser = null;
        if (unsubscribeTransactions) {
          unsubscribeTransactions();
          unsubscribeTransactions = null;
        }
        allTransactions = [];
        resetTransactionForm();
        renderSummaryCards();
        renderFeed();
        showScreen('screen-auth');
      }
    });

  } catch (initErr) {
    console.error('Fatal initialization error:', initErr);
    showScreen('screen-setup-required');
    showToast('Failed to initialize Firebase: ' + initErr.message, 'error');
  }
}

// ===============================================================
// AUTHENTICATION MODULE
// ===============================================================
let authMode = 'login'; // 'login' | 'signup'
let isPasswordVisible = false;

function setupAuthListeners({
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
}) {
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const fieldName = document.getElementById('field-auth-name');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const authSubmitLabel = document.getElementById('auth-submit-label');
  const authSubmitSpinner = document.getElementById('auth-submit-spinner');
  const authForm = document.getElementById('form-auth');
  const btnGoogle = document.getElementById('btn-google-auth');
  const btnTogglePass = document.getElementById('btn-toggle-password');
  const inputPass = document.getElementById('input-auth-password');
  const iconEyeOpen = document.getElementById('icon-eye-open');
  const iconEyeClosed = document.getElementById('icon-eye-closed');
  const authAlert = document.getElementById('auth-alert');
  const authAlertMsg = document.getElementById('auth-alert-message');
  const authAlertIcon = document.getElementById('auth-alert-icon');
  const btnForgotLink = document.getElementById('btn-forgot-password-link');

  function setAuthMode(mode) {
    authMode = mode;
    hideAuthAlert();
    clearAuthInlineErrors();

    if (mode === 'login') {
      tabLogin.setAttribute('aria-selected', 'true');
      tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-indigo-700 bg-white shadow-sm';
      tabSignup.setAttribute('aria-selected', 'false');
      tabSignup.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900';
      authTitle.textContent = 'Sign in to your account';
      authSubtitle.textContent = 'Manage your expenses, track cash flow, and achieve financial clarity.';
      fieldName.classList.add('hidden');
      authSubmitLabel.textContent = 'Log In';
    } else {
      tabSignup.setAttribute('aria-selected', 'true');
      tabSignup.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-indigo-700 bg-white shadow-sm';
      tabLogin.setAttribute('aria-selected', 'false');
      tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900';
      authTitle.textContent = 'Create your account';
      authSubtitle.textContent = 'Start tracking your expenses with zero setup fees.';
      fieldName.classList.remove('hidden');
      authSubmitLabel.textContent = 'Create Account';
    }
  }

  tabLogin.addEventListener('click', () => setAuthMode('login'));
  tabSignup.addEventListener('click', () => setAuthMode('signup'));

  // Toggle Password Visibility
  btnTogglePass.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    inputPass.type = isPasswordVisible ? 'text' : 'password';
    if (isPasswordVisible) {
      iconEyeOpen.classList.add('hidden');
      iconEyeClosed.classList.remove('hidden');
    } else {
      iconEyeOpen.classList.remove('hidden');
      iconEyeClosed.classList.add('hidden');
    }
  });

  // Password inline validation on typing
  inputPass.addEventListener('input', () => {
    const errorPass = document.getElementById('error-auth-password');
    if (authMode === 'signup' && inputPass.value.length > 0 && inputPass.value.length < 6) {
      errorPass.textContent = 'Password must be at least 6 characters.';
      errorPass.classList.remove('hidden');
    } else {
      errorPass.classList.add('hidden');
    }
  });

  document.getElementById('input-auth-email').addEventListener('input', () => {
    document.getElementById('error-auth-email').classList.add('hidden');
  });

  function showAuthAlert(msg, isError = true) {
    authAlert.classList.remove('hidden', 'bg-rose-50', 'text-rose-700', 'border', 'border-rose-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    if (isError) {
      authAlert.classList.add('bg-rose-50', 'text-rose-700', 'border', 'border-rose-200');
      authAlertIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />`;
    } else {
      authAlert.classList.add('bg-emerald-50', 'text-emerald-700', 'border', 'border-emerald-200');
      authAlertIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />`;
    }
    authAlertMsg.textContent = msg;
  }

  function hideAuthAlert() {
    authAlert.classList.add('hidden');
  }

  function clearAuthInlineErrors() {
    document.getElementById('error-auth-email').classList.add('hidden');
    document.getElementById('error-auth-password').classList.add('hidden');
  }

  // Handle Email / Password Form Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();
    clearAuthInlineErrors();

    const email = document.getElementById('input-auth-email').value.trim();
    const password = inputPass.value;
    const name = document.getElementById('input-auth-name').value.trim();

    let hasValidationError = false;
    if (!email) {
      const errEmail = document.getElementById('error-auth-email');
      errEmail.textContent = 'Email address is required.';
      errEmail.classList.remove('hidden');
      hasValidationError = true;
    }
    if (!password) {
      const errPass = document.getElementById('error-auth-password');
      errPass.textContent = 'Password is required.';
      errPass.classList.remove('hidden');
      hasValidationError = true;
    } else if (password.length < 6) {
      const errPass = document.getElementById('error-auth-password');
      errPass.textContent = 'Password must be at least 6 characters.';
      errPass.classList.remove('hidden');
      hasValidationError = true;
    }

    if (hasValidationError) return;

    btnAuthSubmit.disabled = true;
    authSubmitSpinner.classList.remove('hidden');

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (name && userCred.user) {
          await updateProfile(userCred.user, { displayName: name });
        }
      }
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err.code);
      showAuthAlert(friendlyMessage, true);
    } finally {
      btnAuthSubmit.disabled = false;
      authSubmitSpinner.classList.add('hidden');
    }
  });

  // Handle Google Sign In
  btnGoogle.addEventListener('click', async () => {
    hideAuthAlert();
    btnGoogle.disabled = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const friendlyMessage = getFriendlyAuthErrorMessage(err.code);
        showAuthAlert(friendlyMessage, true);
      }
    } finally {
      btnGoogle.disabled = false;
    }
  });

  // Forgot Password Modal Handlers
  btnForgotLink.addEventListener('click', () => {
    const emailVal = document.getElementById('input-auth-email').value.trim();
    if (emailVal) {
      document.getElementById('input-reset-email').value = emailVal;
    }
    document.getElementById('alert-reset-email').classList.add('hidden');
    document.getElementById('error-reset-email').classList.add('hidden');
    openModal('modal-forgot-password');
  });

  document.getElementById('btn-close-forgot-modal').addEventListener('click', () => {
    closeModal('modal-forgot-password');
  });

  document.getElementById('btn-cancel-reset').addEventListener('click', () => {
    closeModal('modal-forgot-password');
  });

  const formReset = document.getElementById('form-reset-password');
  formReset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resetEmail = document.getElementById('input-reset-email').value.trim();
    const errReset = document.getElementById('error-reset-email');
    const alertReset = document.getElementById('alert-reset-email');
    const spinnerReset = document.getElementById('spinner-reset');
    const btnSubmitReset = document.getElementById('btn-submit-reset');

    errReset.classList.add('hidden');
    alertReset.classList.add('hidden');

    if (!resetEmail) {
      errReset.textContent = 'Please enter your registered email address.';
      errReset.classList.remove('hidden');
      return;
    }

    btnSubmitReset.disabled = true;
    spinnerReset.classList.remove('hidden');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alertReset.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200';
      alertReset.textContent = `Password reset link sent! Check ${resetEmail} to reset your password.`;
      alertReset.classList.remove('hidden');
      setTimeout(() => {
        closeModal('modal-forgot-password');
      }, 3500);
    } catch (err) {
      alertReset.className = 'p-3 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200';
      alertReset.textContent = getFriendlyAuthErrorMessage(err.code);
      alertReset.classList.remove('hidden');
    } finally {
      btnSubmitReset.disabled = false;
      spinnerReset.classList.add('hidden');
    }
  });
}

function updateUserHeader(user) {
  const displayEl = document.getElementById('user-display-identity');
  const avatarInitial = document.getElementById('user-avatar-initial');
  const displayName = user.displayName || user.email || 'User';
  
  if (displayEl) {
    displayEl.textContent = displayName;
    displayEl.title = user.email || displayName;
  }
  if (avatarInitial) {
    avatarInitial.textContent = (displayName[0] || 'U').toUpperCase();
  }
}

// ===============================================================
// FIRESTORE REAL-TIME SYNCHRONIZATION
// ===============================================================
function startFirestoreListener({ db, collection, onSnapshot, uid }) {
  const feedSkeleton = document.getElementById('feed-skeleton');
  const transactionsList = document.getElementById('transactions-list');
  const syncIndicator = document.getElementById('sync-indicator');

  if (unsubscribeTransactions) {
    unsubscribeTransactions();
  }

  const transactionsCol = collection(db, 'users', uid, 'transactions');

  // Real-time listener for current user's transactions
  unsubscribeTransactions = onSnapshot(transactionsCol, (snapshot) => {
    const rawDocs = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      rawDocs.push({
        id: docSnap.id,
        description: data.description || '',
        amountCents: typeof data.amountCents === 'number' ? data.amountCents : 0,
        type: data.type === 'income' ? 'income' : 'expense',
        category: data.category || 'Miscellaneous',
        date: data.date || '',
        createdAt: data.createdAt ? data.createdAt.toMillis?.() || Date.now() : Date.now()
      });
    });

    // Client-side multi-key sort: newest date first, then newest createdAt first
    rawDocs.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt - a.createdAt;
    });

    allTransactions = rawDocs;

    // Update UI components
    if (feedSkeleton) feedSkeleton.classList.add('hidden');
    if (transactionsList) transactionsList.classList.remove('hidden');
    if (syncIndicator) {
      syncIndicator.title = 'Live sync active with Cloud Firestore';
    }

    renderSummaryCards();
    renderFeed();
    updateActionButtonsState();

  }, (error) => {
    console.error('Firestore onSnapshot error:', error);
    showToast('Failed to sync transactions: ' + error.message, 'error');
    if (feedSkeleton) feedSkeleton.classList.add('hidden');
  });
}

// ===============================================================
// FINANCIAL CALCULATIONS & SUMMARY CARDS
// ===============================================================
function renderSummaryCards() {
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  // Always compute across ALL user transactions (unaffected by filters)
  for (const item of allTransactions) {
    if (item.type === 'income') {
      totalIncomeCents += item.amountCents;
      incomeCount++;
    } else {
      totalExpenseCents += item.amountCents;
      expenseCount++;
    }
  }

  const netBalanceCents = totalIncomeCents - totalExpenseCents;

  const statNetBalance = document.getElementById('stat-net-balance');
  const statTotalIncome = document.getElementById('stat-total-income');
  const statTotalExpenses = document.getElementById('stat-total-expenses');
  const badgeBalanceStatus = document.getElementById('badge-balance-status');
  const countIncomeEl = document.getElementById('count-income-transactions');
  const countExpenseEl = document.getElementById('count-expense-transactions');

  if (countIncomeEl) countIncomeEl.textContent = incomeCount;
  if (countExpenseEl) countExpenseEl.textContent = expenseCount;

  if (statTotalIncome) {
    statTotalIncome.textContent = `+${formatCurrency(totalIncomeCents)}`;
  }
  if (statTotalExpenses) {
    statTotalExpenses.textContent = `-${formatCurrency(totalExpenseCents)}`;
  }

  if (statNetBalance && badgeBalanceStatus) {
    if (netBalanceCents > 0) {
      statNetBalance.textContent = `+${formatCurrency(netBalanceCents)}`;
      statNetBalance.className = 'text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600';
      badgeBalanceStatus.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
      badgeBalanceStatus.textContent = 'Surplus';
    } else if (netBalanceCents < 0) {
      statNetBalance.textContent = `-${formatCurrency(Math.abs(netBalanceCents))}`;
      statNetBalance.className = 'text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600';
      badgeBalanceStatus.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200';
      badgeBalanceStatus.textContent = 'Deficit';
    } else {
      statNetBalance.textContent = '$0.00';
      statNetBalance.className = 'text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900';
      badgeBalanceStatus.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700';
      badgeBalanceStatus.textContent = 'Balanced';
    }
  }
}

function updateActionButtonsState() {
  const btnExport = document.getElementById('btn-export-csv');
  const btnClearAll = document.getElementById('btn-open-clear-all');
  const hasTransactions = allTransactions.length > 0;

  if (btnExport) btnExport.disabled = !hasTransactions;
  if (btnClearAll) btnClearAll.disabled = !hasTransactions;
}

// ===============================================================
// TRANSACTIONS FEED & FILTERING
// ===============================================================
function getFilteredTransactions() {
  return allTransactions.filter(item => {
    // 1. Filter by Type
    if (activeFilterType !== 'ALL' && item.type !== activeFilterType) {
      return false;
    }
    // 2. Filter by Category
    if (activeFilterCategory !== 'ALL' && item.category !== activeFilterCategory) {
      return false;
    }
    // 3. Filter by Search Query
    if (activeSearchQuery) {
      const matchDesc = item.description.toLowerCase().includes(activeSearchQuery);
      if (!matchDesc) return false;
    }
    return true;
  });
}

function renderFeed() {
  const feedList = document.getElementById('transactions-list');
  const emptyAccount = document.getElementById('feed-empty-account');
  const emptyFilter = document.getElementById('feed-empty-filter');
  const badgeCount = document.getElementById('badge-filtered-count');

  if (!feedList) return;
  feedList.innerHTML = '';

  const filtered = getFilteredTransactions();

  if (badgeCount) {
    badgeCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
  }

  // Account is completely empty (no transactions at all)
  if (allTransactions.length === 0) {
    emptyAccount.classList.remove('hidden');
    emptyFilter.classList.add('hidden');
    feedList.classList.add('hidden');
    return;
  }

  // Filters eliminated all results
  if (filtered.length === 0) {
    emptyAccount.classList.add('hidden');
    emptyFilter.classList.remove('hidden');
    feedList.classList.add('hidden');
    return;
  }

  emptyAccount.classList.add('hidden');
  emptyFilter.classList.add('hidden');
  feedList.classList.remove('hidden');

  filtered.forEach(item => {
    const rowEl = createTransactionRowElement(item);
    feedList.appendChild(rowEl);
  });
}

function createTransactionRowElement(item) {
  const li = document.createElement('li');
  li.dataset.id = item.id;
  li.className = 'group animate-row-enter flex items-center justify-between p-3 sm:p-3.5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-xl transition-all shadow-xs';

  // Left Section: Category icon & details
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center gap-3 min-w-0 pr-2';

  const meta = CATEGORY_META[item.category] || CATEGORY_META['Miscellaneous'];

  const iconDiv = document.createElement('div');
  iconDiv.className = `w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${meta.badgeClass}`;
  iconDiv.innerHTML = meta.icon;
  leftDiv.appendChild(iconDiv);

  const textDiv = document.createElement('div');
  textDiv.className = 'min-w-0';

  const descP = document.createElement('p');
  descP.className = 'text-xs sm:text-sm font-bold text-slate-900 truncate';
  descP.textContent = item.description;
  descP.title = item.description;
  textDiv.appendChild(descP);

  const subDiv = document.createElement('div');
  subDiv.className = 'flex items-center gap-2 mt-0.5 text-[11px] text-slate-500';

  const catSpan = document.createElement('span');
  catSpan.className = 'font-medium text-slate-600 truncate';
  catSpan.textContent = item.category;

  const dotSpan = document.createElement('span');
  dotSpan.textContent = '•';

  const dateSpan = document.createElement('span');
  dateSpan.textContent = formatDisplayDate(item.date);

  subDiv.appendChild(catSpan);
  subDiv.appendChild(dotSpan);
  subDiv.appendChild(dateSpan);
  textDiv.appendChild(subDiv);
  leftDiv.appendChild(textDiv);

  // Right Section: Amount & Actions
  const rightDiv = document.createElement('div');
  rightDiv.className = 'flex items-center gap-2 sm:gap-3 flex-shrink-0';

  const amountSpan = document.createElement('span');
  const isIncome = item.type === 'income';
  amountSpan.className = `text-xs sm:text-sm font-bold tracking-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`;
  amountSpan.textContent = `${isIncome ? '+' : '-'}${formatCurrency(item.amountCents)}`;
  rightDiv.appendChild(amountSpan);

  // Action Buttons Container (Edit and Delete)
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 touch-visible transition-opacity';

  // Edit Button
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.title = 'Edit transaction';
  editBtn.setAttribute('aria-label', `Edit ${item.description}`);
  editBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:opacity-100';
  editBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`;
  editBtn.addEventListener('click', () => loadTransactionForEditing(item));
  actionsDiv.appendChild(editBtn);

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.title = 'Delete transaction';
  deleteBtn.setAttribute('aria-label', `Delete ${item.description}`);
  deleteBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:opacity-100';
  deleteBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
  deleteBtn.addEventListener('click', () => promptDeleteItem(item));
  actionsDiv.appendChild(deleteBtn);

  rightDiv.appendChild(actionsDiv);

  li.appendChild(leftDiv);
  li.appendChild(rightDiv);
  return li;
}

// ===============================================================
// ADD & EDIT TRANSACTION FORM
// ===============================================================
let selectedType = 'expense'; // 'expense' | 'income' (defaults to expense)

function setSelectedType(type) {
  selectedType = type;
  const btnExpense = document.getElementById('btn-type-expense');
  const btnIncome = document.getElementById('btn-type-income');

  if (type === 'expense') {
    btnExpense.setAttribute('aria-checked', 'true');
    btnExpense.className = 'py-2 text-xs font-bold rounded-lg transition-all text-rose-700 bg-white shadow-xs flex items-center justify-center gap-1.5';
    btnIncome.setAttribute('aria-checked', 'false');
    btnIncome.className = 'py-2 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5';
  } else {
    btnIncome.setAttribute('aria-checked', 'true');
    btnIncome.className = 'py-2 text-xs font-bold rounded-lg transition-all text-emerald-700 bg-white shadow-xs flex items-center justify-center gap-1.5';
    btnExpense.setAttribute('aria-checked', 'false');
    btnExpense.className = 'py-2 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5';
  }
}

function loadTransactionForEditing(item) {
  currentEditingId = item.id;
  document.getElementById('input-edit-id').value = item.id;
  document.getElementById('form-card-title').textContent = 'Edit Transaction';
  document.getElementById('badge-edit-mode').classList.remove('hidden');
  document.getElementById('btn-cancel-edit').classList.remove('hidden');
  document.getElementById('btn-secondary-cancel').classList.remove('hidden');
  document.getElementById('btn-submit-transaction-label').textContent = 'Save Changes';

  document.getElementById('input-description').value = item.description;
  document.getElementById('char-counter-desc').textContent = `${item.description.length}/60`;
  document.getElementById('input-amount').value = (item.amountCents / 100).toFixed(2);
  document.getElementById('select-category').value = item.category;
  document.getElementById('input-date').value = item.date;
  setSelectedType(item.type);

  clearTransactionErrors();
  document.getElementById('input-description').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetTransactionForm() {
  currentEditingId = null;
  document.getElementById('input-edit-id').value = '';
  document.getElementById('form-card-title').textContent = 'Add New Transaction';
  document.getElementById('badge-edit-mode').classList.add('hidden');
  document.getElementById('btn-cancel-edit').classList.add('hidden');
  document.getElementById('btn-secondary-cancel').classList.add('hidden');
  document.getElementById('btn-submit-transaction-label').textContent = 'Add Transaction';

  document.getElementById('input-description').value = '';
  document.getElementById('char-counter-desc').textContent = '0/60';
  document.getElementById('input-amount').value = '';
  document.getElementById('select-category').value = 'Food & Dining';
  document.getElementById('input-date').value = getLocalTodayDate();
  setSelectedType('expense');

  clearTransactionErrors();
}

function clearTransactionErrors() {
  ['error-description', 'error-amount', 'error-category', 'error-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function validateTransactionInputs() {
  clearTransactionErrors();
  let isValid = true;

  const descInput = document.getElementById('input-description');
  const amountInput = document.getElementById('input-amount');
  const categorySelect = document.getElementById('select-category');
  const dateInput = document.getElementById('input-date');

  const descVal = descInput.value.trim();
  const amountVal = parseFloat(amountInput.value);
  const categoryVal = categorySelect.value;
  const dateVal = dateInput.value;
  const todayLocal = getLocalTodayDate();

  // 1. Description validation
  if (!descVal) {
    const err = document.getElementById('error-description');
    err.textContent = 'Description cannot be empty.';
    err.classList.remove('hidden');
    isValid = false;
  } else if (descVal.length > 60) {
    const err = document.getElementById('error-description');
    err.textContent = 'Description must not exceed 60 characters.';
    err.classList.remove('hidden');
    isValid = false;
  }

  // 2. Amount validation
  if (isNaN(amountVal) || amountVal <= 0) {
    const err = document.getElementById('error-amount');
    err.textContent = 'Please enter a valid amount greater than $0.00.';
    err.classList.remove('hidden');
    isValid = false;
  }

  // 3. Category validation
  if (!ALLOWED_CATEGORIES.includes(categoryVal)) {
    const err = document.getElementById('error-category');
    err.textContent = 'Please select a valid category.';
    err.classList.remove('hidden');
    isValid = false;
  }

  // 4. Date validation (cannot be empty or future date)
  if (!dateVal) {
    const err = document.getElementById('error-date');
    err.textContent = 'Date is required.';
    err.classList.remove('hidden');
    isValid = false;
  } else if (dateVal > todayLocal) {
    const err = document.getElementById('error-date');
    err.textContent = 'Future dates are not allowed.';
    err.classList.remove('hidden');
    isValid = false;
  }

  return {
    isValid,
    description: descVal,
    amountCents: Math.round(amountVal * 100),
    type: selectedType,
    category: categoryVal,
    date: dateVal
  };
}

function promptDeleteItem(item) {
  itemToDelete = item;
  const targetDesc = document.getElementById('delete-target-desc');
  if (targetDesc) targetDesc.textContent = `"${item.description}" (${formatCurrency(item.amountCents)})`;
  openModal('modal-delete-item');
}

// ===============================================================
// DASHBOARD EVENT LISTENERS & FIRESTORE WRITES
// ===============================================================
function setupDashboardListeners({
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  serverTimestamp
}) {
  // Set date field default & max attribute to local today
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    const today = getLocalTodayDate();
    dateInput.value = today;
    dateInput.max = today;
  }

  // Type toggle buttons
  document.getElementById('btn-type-expense').addEventListener('click', () => setSelectedType('expense'));
  document.getElementById('btn-type-income').addEventListener('click', () => setSelectedType('income'));

  // Live character counter & inline error reset
  const descInput = document.getElementById('input-description');
  const counterEl = document.getElementById('char-counter-desc');
  descInput.addEventListener('input', () => {
    counterEl.textContent = `${descInput.value.length}/60`;
    document.getElementById('error-description').classList.add('hidden');
  });
  document.getElementById('input-amount').addEventListener('input', () => {
    document.getElementById('error-amount').classList.add('hidden');
  });
  document.getElementById('input-date').addEventListener('input', () => {
    document.getElementById('error-date').classList.add('hidden');
  });

  // Cancel edit buttons
  document.getElementById('btn-cancel-edit').addEventListener('click', resetTransactionForm);
  document.getElementById('btn-secondary-cancel').addEventListener('click', resetTransactionForm);

  // Form Submission (Add or Edit)
  const transactionForm = document.getElementById('form-transaction');
  const btnSubmitTx = document.getElementById('btn-submit-transaction');
  const spinnerTx = document.getElementById('transaction-spinner');

  transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isWriteInProgress || !currentUser) return;

    const validation = validateTransactionInputs();
    if (!validation.isValid) return;

    isWriteInProgress = true;
    btnSubmitTx.disabled = true;
    spinnerTx.classList.remove('hidden');

    try {
      if (currentEditingId) {
        // Edit mode: update existing document
        const docRef = doc(db, 'users', currentUser.uid, 'transactions', currentEditingId);
        await updateDoc(docRef, {
          description: validation.description,
          amountCents: validation.amountCents,
          type: validation.type,
          category: validation.category,
          date: validation.date
        });
        showToast('Transaction updated successfully.', 'success');
        resetTransactionForm();
      } else {
        // Add mode: create new document
        const colRef = collection(db, 'users', currentUser.uid, 'transactions');
        await addDoc(colRef, {
          description: validation.description,
          amountCents: validation.amountCents,
          type: validation.type,
          category: validation.category,
          date: validation.date,
          createdAt: serverTimestamp()
        });
        showToast('Transaction added successfully.', 'success');
        resetTransactionForm();
        descInput.focus();
      }
    } catch (writeErr) {
      console.error('Firestore write error:', writeErr);
      showToast('Write failed: ' + writeErr.message, 'error');
      // Inputs remain untouched in the form so nothing is lost
    } finally {
      isWriteInProgress = false;
      btnSubmitTx.disabled = false;
      spinnerTx.classList.add('hidden');
    }
  });

  // Delete Single Item Modal Handlers
  document.getElementById('btn-cancel-delete-item').addEventListener('click', () => {
    closeModal('modal-delete-item');
    itemToDelete = null;
  });

  const btnConfirmDeleteItem = document.getElementById('btn-confirm-delete-item');
  const spinnerDeleteItem = document.getElementById('spinner-delete-item');

  btnConfirmDeleteItem.addEventListener('click', async () => {
    if (!itemToDelete || !currentUser || isWriteInProgress) return;
    const docId = itemToDelete.id;

    isWriteInProgress = true;
    btnConfirmDeleteItem.disabled = true;
    spinnerDeleteItem.classList.remove('hidden');

    // Trigger row exit animation in DOM if row exists
    const rowEl = document.querySelector(`li[data-id="${docId}"]`);
    if (rowEl) {
      rowEl.classList.remove('animate-row-enter');
      rowEl.classList.add('animate-row-exit');
    }

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'transactions', docId);
      await deleteDoc(docRef);
      showToast('Transaction deleted.', 'info');
      closeModal('modal-delete-item');

      // If we were editing this specific item, reset form
      if (currentEditingId === docId) {
        resetTransactionForm();
      }
    } catch (delErr) {
      console.error('Firestore delete error:', delErr);
      showToast('Failed to delete transaction: ' + delErr.message, 'error');
      if (rowEl) {
        rowEl.classList.remove('animate-row-exit');
      }
    } finally {
      isWriteInProgress = false;
      btnConfirmDeleteItem.disabled = false;
      spinnerDeleteItem.classList.add('hidden');
      itemToDelete = null;
    }
  });

  // Clear All Data Modal Handlers
  const btnOpenClearAll = document.getElementById('btn-open-clear-all');
  const clearDataCountText = document.getElementById('clear-data-count-text');
  const btnCancelClearAll = document.getElementById('btn-cancel-clear-all');
  const btnConfirmClearAll = document.getElementById('btn-confirm-clear-all');
  const spinnerClearAll = document.getElementById('spinner-clear-all');

  btnOpenClearAll.addEventListener('click', () => {
    if (allTransactions.length === 0) return;
    if (clearDataCountText) {
      clearDataCountText.textContent = `${allTransactions.length} transaction${allTransactions.length === 1 ? '' : 's'}`;
    }
    openModal('modal-clear-all');
  });

  btnCancelClearAll.addEventListener('click', () => {
    closeModal('modal-clear-all');
  });

  btnConfirmClearAll.addEventListener('click', async () => {
    if (!currentUser || isWriteInProgress || allTransactions.length === 0) return;

    isWriteInProgress = true;
    btnConfirmClearAll.disabled = true;
    spinnerClearAll.classList.remove('hidden');

    try {
      const colRef = collection(db, 'users', currentUser.uid, 'transactions');
      const snapshot = await getDocs(colRef);
      const docs = snapshot.docs;

      // Firestore writeBatch supports up to 500 operations per batch
      const BATCH_SIZE = 500;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
      }

      showToast(`Cleared ${docs.length} transactions.`, 'success');
      resetTransactionForm();
      closeModal('modal-clear-all');
    } catch (batchErr) {
      console.error('Batch delete failed:', batchErr);
      showToast('Clear all failed: ' + batchErr.message, 'error');
    } finally {
      isWriteInProgress = false;
      btnConfirmClearAll.disabled = false;
      spinnerClearAll.classList.add('hidden');
    }
  });

  // Filter Bar Handlers
  const filterAll = document.getElementById('filter-type-all');
  const filterInc = document.getElementById('filter-type-income');
  const filterExp = document.getElementById('filter-type-expense');
  const filterCat = document.getElementById('filter-category');
  const searchInput = document.getElementById('filter-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  function updateTypeFilterUI(type) {
    activeFilterType = type;
    [filterAll, filterInc, filterExp].forEach(btn => {
      btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900';
    });

    if (type === 'ALL') {
      filterAll.className = 'px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-indigo-700 bg-white shadow-xs';
    } else if (type === 'income') {
      filterInc.className = 'px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-emerald-700 bg-white shadow-xs';
    } else if (type === 'expense') {
      filterExp.className = 'px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-rose-700 bg-white shadow-xs';
    }
    renderFeed();
  }

  filterAll.addEventListener('click', () => updateTypeFilterUI('ALL'));
  filterInc.addEventListener('click', () => updateTypeFilterUI('income'));
  filterExp.addEventListener('click', () => updateTypeFilterUI('expense'));

  filterCat.addEventListener('change', () => {
    activeFilterCategory = filterCat.value;
    renderFeed();
  });

  searchInput.addEventListener('input', () => {
    activeSearchQuery = searchInput.value.trim().toLowerCase();
    if (activeSearchQuery) {
      btnClearSearch.classList.remove('hidden');
    } else {
      btnClearSearch.classList.add('hidden');
    }
    renderFeed();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    activeSearchQuery = '';
    btnClearSearch.classList.add('hidden');
    renderFeed();
  });

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      activeFilterCategory = 'ALL';
      filterCat.value = 'ALL';
      searchInput.value = '';
      activeSearchQuery = '';
      btnClearSearch.classList.add('hidden');
      updateTypeFilterUI('ALL');
    });
  }

  // Export CSV Handler (with Spreadsheet Injection Shield)
  const btnExportCsv = document.getElementById('btn-export-csv');
  btnExportCsv.addEventListener('click', () => {
    if (allTransactions.length === 0) return;

    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount (USD)'];
    const rows = allTransactions.map(item => {
      const formattedAmount = (item.amountCents / 100).toFixed(2);
      return [
        sanitizeCsvCell(item.date),
        sanitizeCsvCell(item.description),
        sanitizeCsvCell(item.type),
        sanitizeCsvCell(item.category),
        sanitizeCsvCell(formattedAmount)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${getLocalTodayDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Transactions exported as CSV.', 'success');
  });

  // Log Out Handler
  const btnLogout = document.getElementById('btn-logout');
  btnLogout.addEventListener('click', async () => {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
      if (unsubscribeTransactions) {
        unsubscribeTransactions();
        unsubscribeTransactions = null;
      }
      await signOut(auth);
      showToast('Logged out successfully.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Logout error: ' + err.message, 'error');
    }
  });
}

// Start application initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
