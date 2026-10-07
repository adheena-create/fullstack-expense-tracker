# Personal Finance Dashboard

A production-ready, single-page expense tracker and cash flow dashboard with user accounts, real-time Cloud Firestore synchronization, and Firebase Authentication.

Built with HTML5, Tailwind CSS, and modular vanilla JavaScript (Firebase Web SDK v10).

---

## Features

- **Real-Time Database**: Multi-device live synchronization via Cloud Firestore `onSnapshot`.
- **Zero Dummy Data**: New accounts start with a clean zero balance and empty state.
- **Precision Currency Calculation**: All amounts are represented and calculated in integer cents to completely eliminate IEEE-754 floating-point rounding errors.
- **Granular Security**: Production `firestore.rules` enforcing strict per-user data isolation and rigorous schema validation.
- **Full Authentication**: Email/Password and Google Sign-In, profile updating, password reset emails, and friendly error translation.
- **Transaction Management**: Add, edit, delete, filter by type (Income/Expense), filter by category, real-time description search, and chunked batch deletion (up to 500 documents per batch).
- **Secure CSV Export**: Export user transactions with automatic protection against CSV/spreadsheet formula injection attacks (`=`, `+`, `-`, `@`).
- **Offline Resilience**: IndexedDB offline caching enabled for reliable performance.
- **Accessible UI/UX**: Keyboard navigation, focus trapping, Escape key modal closing, live regions (`aria-live`), and respect for `prefers-reduced-motion`.

---

## Step-by-Step Firebase Setup Guide

Follow these simple steps to connect your own Firebase project:

### Step 1: Create a Firebase Project
1. Open your browser and navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (for example, `my-expense-tracker`).
4. You can disable Google Analytics or keep it enabled, then click **Create project**.

---

### Step 2: Register a Web App & Get Keys
1. In the Firebase project overview page, click the Web icon (**`</>`**) to register a web application.
2. Enter an app nickname (such as `Expense Tracker Web`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` object, looking similar to this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-expense-tracker.firebaseapp.com",
     projectId: "my-expense-tracker",
     storageBucket: "my-expense-tracker.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```
5. Open `firebase-config.js` in your workspace and paste these values into the exported `firebaseConfig` object:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
6. Save `firebase-config.js`.

---

### Step 3: Enable Authentication Providers
1. In the left navigation menu of the Firebase Console, click **Build** &rarr; **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab:
   - Click **Email/Password**, toggle **Enable**, and click **Save**. (You do not need Email link passwordless).
   - Click **Add new provider**, select **Google**, toggle **Enable**, choose your Project support email, and click **Save**.

---

### Step 4: Create Cloud Firestore Database
1. In the left navigation menu, click **Build** &rarr; **Firestore Database**.
2. Click **Create database**.
3. Select your preferred database location (e.g. `nam5 (us-central)` or the region closest to you).
4. When prompted for Security Rules, choose **Start in production mode**, then click **Create**.

---

### Step 5: Publish Firestore Security Rules
1. In the Firestore Database section, click on the **Rules** tab at the top.
2. Copy the entire contents of the [`firestore.rules`](./firestore.rules) file in this repository.
3. Paste it into the editor replacing the default rules.
4. Click **Publish**.

*(Alternatively, if you use the Firebase CLI, run `firebase deploy --only firestore:rules` after logging in).*

---

### Step 6: Verify Authorized Domains
1. In the Firebase Console, navigate to **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.
2. Confirm that `localhost` is listed (it is included by default).
3. When you later deploy to production (e.g., your custom domain, Firebase Hosting, or Netlify), click **Add domain** and enter your live domain name.

---

## Running Locally

Because the application uses modern JavaScript ES Modules (`type="module"`), browsers require the files to be served via HTTP rather than opened as raw `file://` paths.

### Option A: Using the Included PowerShell Server (Zero Dependencies)
A lightweight HTTP server is pre-configured for this workspace. In PowerShell, run:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Then open:
```
http://localhost:8080/
```

### Option B: Using Node.js / npx (if Node is installed)
```bash
npx serve .
# or
npx http-server .
```

### Option C: Using Python (if Python is installed)
```bash
python -m http.server 8080
```

---

## Free Production Deployment

### Deployment Option 1: Firebase Hosting (Recommended)
1. Install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Firebase account:
   ```bash
   firebase login
   ```
3. Set your active project:
   ```bash
   firebase use --add
   ```
   (Select the Firebase project ID you created earlier).
4. Deploy the application and security rules:
   ```bash
   firebase deploy
   ```
5. Firebase will provide your live hosting URL (e.g., `https://<your-project-id>.web.app`).

### Deployment Option 2: Netlify (Free Drag-and-Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this folder (`expense_calculator`) into the upload zone.
3. Netlify will deploy your site instantly with a free SSL certificate.
4. Add your Netlify subdomain (e.g., `https://my-expense-tracker.netlify.app`) to Firebase Console &rarr; **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.

---

## File Structure

```
expense_calculator/
├── index.html            # Core Single Page Application markup & accessible modals
├── style.css             # Custom typography, animations, scrollbars & responsive rules
├── app.js                # Core JS logic: Auth, Firestore sync, money calculations, filtering
├── firebase-config.js    # Firebase credentials export with configuration checker
├── firestore.rules       # Strict per-user Firestore security rules
├── firebase.json         # Firebase Hosting & Firestore deployment configuration
├── serve.ps1             # Native PowerShell HTTP server for zero-dependency local testing
└── README.md             # Beginner-friendly setup, testing, and deployment manual
```
