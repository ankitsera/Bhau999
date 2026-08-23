# A1Online Admin Panel

A modern, responsive admin dashboard built with React and Material-UI for managing a gaming/betting platform. Features user management, game settings, result declaration, withdrawal processing, and comprehensive reporting.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![MUI](https://img.shields.io/badge/MUI-5.15.21-007FFF?logo=mui)
![Vite](https://img.shields.io/badge/Vite-4.4.11-646CFF?logo=vite)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Available Pages](#-available-pages)
- [API Integration](#-api-integration)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [License](#-license)

## ✨ Features

### 📊 Dashboard
- Real-time statistics (Total Users, Bids, Amounts, Games)
- Quick navigation to detailed pages
- Global user approval toggle

### 👥 User Management
- Comprehensive user listing with pagination
- Search functionality (username, phone, name)
- Filter users by approval status
- Approve/Unapprove users
- Update user wallet points
- Change user passwords
- View detailed user history:
  - Fund deposits
  - Withdrawals
  - Bid history
  - Win history
- WhatsApp integration for direct communication

### 🎮 Game Result Declaration
- Select game and result type (Open/Close)
- Choose bid values from predefined list
- Auto-calculate middle digit
- Preview winners before declaration
- Edit individual bids
- Declare results with validation

### ⚙️ Game Settings
- Create, edit, and delete games
- Set game timings (open/close time)
- Configure weekend availability (Saturday/Sunday)
- Temporarily close/open games
- View current game results

### 💰 Withdrawal Management
- Date-wise withdrawal request filtering
- Approve/Reject withdrawal requests
- Color-coded status (Green: Approved, Red: Rejected)
- View UPI details

### 💵 Add Funds
- Search and select users
- Add funds directly to user wallets
- Instant wallet updates

### 📈 Report Management
- Date-wise auto deposit history
- Total amount calculation
- Detailed transaction records
- Pagination support

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.4.11
- **UI Library**: Material-UI (MUI) 5.15.21
- **Routing**: React Router DOM 6.16.0
- **HTTP Client**: Native Fetch API
- **Date Handling**: Day.js, Date-fns
- **Forms**: React Hook Form 7.47.0
- **Charts**: ApexCharts + React-ApexCharts
- **Icons**: Iconify, FontAwesome
- **Styling**: Emotion + Styled Components

### Backend (API)
- Django REST Framework (expected)
- RESTful API architecture

## 📦 Prerequisites

- **Node.js**: v16+ or v18+ (recommended)
- **npm**: v8+ or **yarn**: v1.22+
- **Backend API**: Django REST API running on configured URL

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd a1onlineadmin
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

## ⚙️ Configuration

### API Configuration

Edit `src/variables.js` to configure your backend API URLs:

```javascript
export const API_URL = "https://your-api-domain.com/api/" || "http://localhost:8000/api/"
export const ROOT_URL = "https://your-api-domain.com/" || "http://localhost:8000/"
export const IMAGE_URL = "https://your-api-domain.com/" || "http://localhost:8000/"
```

### Game Type Configuration

The following game types are preconfigured in `src/variables.js`:

```javascript
export const Game_sub_type = {
    "SD": "Single Digit", 
    "JD": "Jodi Digit", 
    "SP": "Single Panna", 
    "DP": "Double Pannna", 
    "TP": "Triple Panna",
    "HS": "Half Sangam",
    "FS": "Full Sangam" 
}
```

### Authentication System

#### Current Status

⚠️ **Authentication is currently BYPASSED** for development/testing purposes.

#### Authentication Mechanism

The application uses **Token-Based Authentication** with the following components:

##### 1. **Authentication Type**
- **Method**: Token-based authentication (similar to JWT pattern)
- **Storage**: Browser localStorage
- **Token Format**: String token received from Django backend
- **Expiration**: 30-minute timeout from login

##### 2. **Storage Implementation**

**Location**: Browser's `localStorage` API

**Stored Items**:
```javascript
localStorage: {
  "token": "authentication_token_string",      // Auth token
  "logged_at": "2024-01-20T10:30:00Z"         // Login timestamp (Dayjs format)
}
```

##### 3. **Helper Functions** (`src/helper.js`)

**a. Get Token**
```javascript
export const getToken = () => {
    const token = localStorage.getItem("token")
    return token
}
```
- Retrieves authentication token from localStorage
- Returns token string or null
- Used in API calls for Authorization header

**b. Save Token**
```javascript
export const saveToken = (token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("logged_at", dayjs())
}
```
- Stores token in localStorage
- Records login timestamp using Dayjs
- Called after successful login

**c. Remove Token**
```javascript
export const removeToken = () => {
    localStorage.removeItem("token")
}
```
- Clears token from localStorage
- Called during logout
- Called when token is invalid/expired

##### 4. **Protected Route Logic** (`src/routes/sections.jsx`)

**Currently Bypassed Implementation**:
```javascript
const ProtectedRoute = () => {
  // AUTH BYPASSED - Always allow access for development/testing
  return <Outlet />
}
```

**Full Implementation** (Currently Commented Out):
```javascript
const ProtectedRoute = () => {
  const getVerification = () => {
    // Step 1: Check if token exists
    let token = getToken()
    if (token == '' || token == null || token == undefined){
      return false;
    }
    
    // Step 2: Check if login timestamp exists
    let create_time = window.localStorage.getItem("logged_at")
    if (create_time == null){
      removeToken()
      return false;
    }
    
    // Step 3: Check if token has expired (30-minute timeout)
    if (dayjs().diff(create_time, 'minute') > 30){
      removeToken()
      localStorage.removeItem("logged_at")
      return false
    }
    
    return true
  }
  
  // Redirect to login if verification fails
  if (!getVerification()) {
    return <Navigate to="/" replace />
  }
  
  return <Outlet />
}
```

##### 5. **Authentication Flow**

**A. Login Flow** (Expected - Not yet implemented)
```
User enters credentials on login page
  ↓
POST /api/auth/login { username, password }
  ↓
Backend validates credentials
  ↓
Backend returns { token: "auth_token_string" }
  ↓
Frontend calls saveToken(token)
  ↓
Token & timestamp stored in localStorage
  ↓
User redirected to /dashboard
  ↓
ProtectedRoute allows access
```

**B. Protected Route Access Flow**
```
User navigates to protected route
  ↓
ProtectedRoute component executes
  ↓
getVerification() checks:
  1. Token exists? ✓
  2. Timestamp exists? ✓
  3. Token not expired? ✓
  ↓
All checks pass → Render <Outlet /> (show page)
Any check fails → <Navigate to="/" /> (redirect to login)
```

**C. Logout Flow**
```
User clicks "Logout" button (in header)
  ↓
handleLogout() function executes
  ↓
window.localStorage.clear()
  ↓
navigate("/")
  ↓
User redirected to login/home
```

**Code**: `src/layouts/dashboard/header.jsx:47-50`
```javascript
const handleLogout = () => {
  window.localStorage.clear()
  navigate("/")
}
```

**D. Token Expiration Flow**
```
User logged in 31+ minutes ago
  ↓
User navigates to any protected route
  ↓
getVerification() checks expiration
  ↓
dayjs().diff(logged_at, 'minute') > 30 → TRUE
  ↓
removeToken() called
  ↓
localStorage cleared
  ↓
Return false → User redirected to login
```

##### 6. **API Request Authentication**

**Header Format**:
```javascript
headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Authorization": `token ${getToken()}`  // Token-based auth
}
```

**Example Usage** (from `header.jsx:59-78`):
```javascript
const handleChangePass = async() => {
  try {
    let res = await fetch(`${API_URL}users/user-info/change-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `token ${getToken()}`  // ← Auth header
      },
      body: JSON.stringify({password: newPass})
    })
    let data = await res.json()
    // Handle response...
  } catch (error) {
    console.error(error);
  }
}
```

**Note**: Currently, most API calls in the codebase do NOT include the Authorization header because:
1. APIs are mocked with dummy data
2. Authentication is bypassed
3. When reconnecting real APIs, add auth headers where needed

##### 7. **Backend API Expectations**

**Expected Endpoints**:

**a. Login** (Not yet implemented in frontend)
```javascript
POST /api/auth/login/
Request: {
  username: string,
  password: string
}
Response: {
  token: string,
  user: {
    id: number,
    username: string,
    email: string,
    // ... other user fields
  }
}
```

**b. Token Validation** (Implicit)
- Backend should validate token on each authenticated request
- Return 401 Unauthorized if token is invalid
- Frontend should catch 401 and redirect to login

**c. Token Format**
- Django REST Framework Token: `Token abcd1234efgh5678...`
- Simple string token stored in localStorage

##### 8. **Enabling Authentication**

**Step 1**: Uncomment Protected Route Logic
```javascript
// File: src/routes/sections.jsx (lines 22-45)
// Remove the bypass and uncomment the full verification logic
```

**Step 2**: Implement Login Page
```javascript
// File: src/pages/login.jsx (currently minimal)
// Add form with username/password
// Add API call to login endpoint
// Call saveToken() on success
```

**Step 3**: Add Authorization Headers
```javascript
// In all API calls that require authentication:
headers: {
  "Authorization": `token ${getToken()}`
}
```

**Step 4**: Handle 401 Responses
```javascript
// Add global error handler or per-request logic:
if (res.status === 401) {
  removeToken()
  navigate('/')
}
```

##### 9. **Security Considerations**

⚠️ **Current Security Issues**:

1. **No HTTPS Enforcement**
   - Tokens transmitted over HTTP in development
   - **Fix**: Use HTTPS in production

2. **localStorage Vulnerability**
   - Tokens stored in localStorage are vulnerable to XSS
   - **Better Alternative**: Use httpOnly cookies (requires backend change)

3. **No Token Refresh**
   - 30-minute hard timeout, no refresh mechanism
   - **Improvement**: Implement refresh token pattern

4. **Simple Token Format**
   - Not using JWT with claims/expiration
   - **Improvement**: Consider JWT for built-in expiration

5. **No CSRF Protection**
   - Using token auth without CSRF tokens
   - **Acceptable**: Token auth is generally CSRF-safe

**Recommendations for Production**:

```javascript
// 1. Add token refresh before expiration
useEffect(() => {
  const interval = setInterval(() => {
    const loggedAt = localStorage.getItem("logged_at")
    if (loggedAt && dayjs().diff(loggedAt, 'minute') > 25) {
      // Refresh token before expiration
      refreshToken()
    }
  }, 60000) // Check every minute
  return () => clearInterval(interval)
}, [])

// 2. Add 401 interceptor
const handleUnauthorized = (response) => {
  if (response.status === 401) {
    removeToken()
    window.location.href = '/'
  }
}

// 3. Add loading state for auth check
const [isAuthChecking, setIsAuthChecking] = useState(true)
```

##### 10. **Authentication State Summary**

| Feature | Status | Implementation |
|---------|--------|----------------|
| Token Storage | ✅ Implemented | localStorage with helper functions |
| Token Expiration | ✅ Implemented | 30-minute timeout with dayjs |
| Protected Routes | ⚠️ Configured but bypassed | Needs uncommenting |
| Login Page | ❌ Not implemented | Exists but empty |
| Logout | ✅ Implemented | Clears localStorage + redirect |
| Auth Headers | ⚠️ Partial | Only in header.jsx change password |
| Token Refresh | ❌ Not implemented | Should add before production |
| 401 Handling | ❌ Not implemented | Should add global handler |

##### 11. **Testing Authentication Locally**

**Quick Test Steps**:

1. **Manual Token Setting**:
```javascript
// In browser console
localStorage.setItem("token", "test_token_123")
localStorage.setItem("logged_at", dayjs().toISOString())
```

2. **Uncomment Protection**:
```javascript
// src/routes/sections.jsx - uncomment lines 22-45
```

3. **Test Access**:
- Navigate to `/dashboard`
- Should work if token/timestamp exist
- Delete token → Should redirect to `/`

4. **Test Expiration**:
```javascript
// Set old timestamp (31 minutes ago)
localStorage.setItem("logged_at", dayjs().subtract(31, 'minute').toISOString())
// Navigate to any route → Should redirect
```

## 🎯 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

The application will start at `http://localhost:3030`

### Development with Network Access

```bash
npm run dev:host
# or
yarn dev:host
```

### Preview Production Build

```bash
npm run start
# or
yarn start
```

## 📁 Project Structure

```
a1onlineadmin/
├── public/                      # Static assets
│   ├── assets/                  # Images, icons, illustrations
│   └── favicon/                 # Favicon files
├── src/
│   ├── _mock/                   # Mock data (currently used)
│   │   ├── account.js
│   │   ├── blog.js
│   │   └── products.js
│   ├── components/              # Reusable components
│   │   ├── chart/
│   │   ├── iconify/
│   │   ├── logo/
│   │   └── scrollbar/
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-responsive.js
│   │   └── use-scroll-to-top.js
│   ├── layouts/                 # Layout components
│   │   └── dashboard/
│   │       ├── common/
│   │       ├── config-navigation.jsx
│   │       ├── header.jsx
│   │       ├── index.jsx
│   │       ├── main.jsx
│   │       └── nav.jsx
│   ├── pages/                   # Page components
│   │   ├── app.jsx              # Dashboard page
│   │   ├── user.jsx             # User management
│   │   ├── products.jsx         # Result declaration
│   │   ├── withdraw.jsx         # Withdrawal requests
│   │   ├── pending.jsx          # Add funds
│   │   ├── gameSetting.jsx      # Game settings
│   │   └── report.jsx           # Reports
│   ├── routes/                  # Routing configuration
│   │   └── sections.jsx
│   ├── sections/                # Page-specific views
│   │   ├── overview/            # Dashboard sections
│   │   ├── user/                # User management views
│   │   ├── products/            # Result declaration views
│   │   ├── withdraw/            # Withdrawal views
│   │   ├── pending/             # Add funds views
│   │   ├── gameSetting/         # Game settings views
│   │   └── report/              # Report views
│   ├── theme/                   # MUI theme configuration
│   ├── app.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   ├── helper.js                # Helper functions
│   ├── variables.js             # Configuration constants
│   └── global.css               # Global styles
├── .eslintrc                    # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
└── README.md                    # This file
```

## 🛣 Routing Architecture

### Overview

The application uses **React Router v6** with **lazy-loaded routes** for optimal performance. All routing logic is centralized in `src/routes/sections.jsx`.

### Routing Flow

```
Entry: index.html
  ↓
src/main.jsx (BrowserRouter wrapper)
  ↓
src/app.jsx (ThemeProvider wrapper)
  ↓
src/routes/sections.jsx (Route definitions)
  ↓
Pages (lazy loaded) → Views (actual components)
```

### Route Configuration Structure

```javascript
// src/routes/sections.jsx
import { lazy, Suspense } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';

// Lazy-loaded page components
export const IndexPage = lazy(() => import('src/pages/app'));
export const UserPage = lazy(() => import('src/pages/user'));
// ... more pages

export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <ProtectedRoute />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { path: 'dashboard', element: <IndexPage /> },
        { path: 'user', element: <UserPage /> },
        // ... more routes
      ],
    },
    // ... public routes
  ]);
  return routes;
}
```

### Route Types

#### 1. Protected Routes (Wrapped in DashboardLayout)
All these routes include the sidebar navigation and header:

| Path | Component | Page File | View File |
|------|-----------|-----------|-----------|
| `/dashboard` | IndexPage | `pages/app.jsx` | `sections/overview/view/app-view.jsx` |
| `/user` | UserPage | `pages/user.jsx` | `sections/user/view/user-view.jsx` |
| `/products` | ProductsPage | `pages/products.jsx` | `sections/products/view/products-view.jsx` |
| `/blog` | BlogPage | `pages/blog.jsx` | `sections/blog/view/blog-view.jsx` |
| `/game-setting` | GameSettingPage | `pages/gameSetting.jsx` | `sections/gameSetting/view/gameSetting-view.jsx` |
| `/withdraw` | WithdrawPage | `pages/withdraw.jsx` | `sections/withdraw/view/withdraw-view.jsx` |
| `/pending` | PendingPage | `pages/pending.jsx` | `sections/pending/view/pending-view.jsx` |
| `/report` | ReportPage | `pages/report.jsx` | `sections/report/view/report-view.jsx` |

#### 2. Public Routes (No Layout)

| Path | Component | Behavior |
|------|-----------|----------|
| `/` | IndexPage | Redirects to Dashboard (auth bypassed) |
| `/404` | Page404 | Error page for invalid routes |
| `*` | Navigate | Redirects any unmatched route to `/404` |

### Protected Route Logic

**Current Status**: ⚠️ **Authentication Bypassed** for testing

```javascript
// src/routes/sections.jsx (lines 21-46)
const ProtectedRoute = () => {
  // AUTH BYPASSED - Always allow access for development/testing
  // Commented out: Token verification, expiration check (30 min)
  return <Outlet />
}
```

**When Enabled**: 
- Checks for valid token in localStorage
- Validates token creation time (30-minute expiration)
- Redirects to `/` if invalid/expired
- Removes expired tokens automatically

### Layout Components

#### DashboardLayout (`src/layouts/dashboard/index.jsx`)

Wraps all protected routes with:

```
┌─────────────────────────────────────┐
│          Header (Top Bar)           │ ← Logout, Change Password
├──────────┬──────────────────────────┤
│          │                          │
│   Nav    │       Main Content       │
│ (Sidebar)│      (Page Views)        │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

**Components**:
- **Header**: Logout button, change password modal, user actions
- **Nav**: Sidebar with navigation menu (from `config-navigation.jsx`)
- **Main**: Content area where page components render

### Navigation Configuration

Sidebar navigation is defined in `src/layouts/dashboard/config-navigation.jsx`:

```javascript
const navConfig = [
  { title: 'dashboard', path: '/dashboard', icon: icon('ic_analytics') },
  { title: 'user', path: '/user', icon: icon('ic_user') },
  { title: 'Game Results', path: '/products', icon: icon('ic_cart') },
  { title: 'Settings', path: '/blog', icon: icon('ic_blog') },
  { title: 'Game Setting', path: '/game-setting', icon: icon('ic_blog') },
  { title: 'Withdraw', path: '/withdraw', icon: icon('ic_lock') },
  { title: 'Add Funds', path: '/pending', icon: icon('ic_disabled') },
  { title: 'Report Management', path: '/report', icon: icon('ic_disabled') },
];
```

### Page-View Architecture

Each route follows this pattern:

```
pages/[page].jsx (wrapper)
  ↓
  - Sets page title via Helmet
  - Imports and renders View component
  ↓
sections/[section]/view/[section]-view.jsx (logic + UI)
  ↓
  - Contains all business logic
  - API calls
  - State management
  - UI rendering
```

**Example**:
```javascript
// pages/user.jsx
export default function UserPage() {
  return (
    <>
      <Helmet>
        <title>User | Minimal UI</title>
      </Helmet>
      <UserView />
    </>
  );
}

// sections/user/view/user-view.jsx
export default function UserPage() {
  const [userData, setUserData] = useState([]);
  // ... all logic, API calls, UI
  return <Container>...</Container>
}
```

### Navigation Methods

#### 1. Programmatic Navigation (within components)

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to user page
navigate('/user');

// Navigate with replace (no history entry)
navigate('/dashboard', { replace: true });
```

**Used in**:
- Dashboard widget cards (click to navigate)
- After successful operations (e.g., after declaring result)
- Logout functionality

#### 2. Router Link (in navigation menu)

```javascript
import { RouterLink } from 'src/routes/components';

<ListItemButton component={RouterLink} href="/user">
  User Management
</ListItemButton>
```

**Used in**:
- Sidebar navigation items
- Any clickable navigation links

### Lazy Loading Benefits

All page components are lazy-loaded using `React.lazy()`:

```javascript
export const UserPage = lazy(() => import('src/pages/user'));
```

**Benefits**:
- Smaller initial bundle size
- Faster initial page load
- Code splitting per route
- Components loaded only when needed

### Route Guards Summary

| Feature | Status | Location |
|---------|--------|----------|
| Authentication Check | ⚠️ Bypassed | `routes/sections.jsx:21-46` |
| Token Validation | ⚠️ Disabled | `helper.js:getToken()` |
| Token Expiration | ⚠️ Not checked | Should check 30-min timeout |
| Protected Routes | ✅ Configured | All routes in DashboardLayout |
| 404 Handling | ✅ Active | Catches all unmatched routes |

## 📄 Available Pages & Detailed Features

### 1. 📊 **Dashboard** (`/dashboard`)

**Route**: `/dashboard`  
**File**: `src/sections/overview/view/app-view.jsx`  
**Purpose**: Admin overview and quick navigation hub

#### Features:

##### A. Statistics Widgets (4 Cards)
All cards are **clickable** and navigate to their respective detail pages:

1. **Total Users Card**
   - Displays: Total user count
   - Icon: Glass bag icon
   - Color: Green/Success
   - Click Action: Navigates to `/user`
   - Hover Effect: Elevates with shadow

2. **Total Bid Card**
   - Displays: Total number of bids placed
   - Icon: Glass users icon
   - Color: Blue/Info
   - Click Action: Navigates to `/products`
   - Hover Effect: Elevates with shadow

3. **Total Bid Amount Card**
   - Displays: Total monetary value of all bids
   - Icon: Glass buy icon
   - Color: Orange/Warning
   - Click Action: Navigates to `/report`
   - Hover Effect: Elevates with shadow

4. **Total Games Card**
   - Displays: Total number of games configured
   - Icon: Glass message icon
   - Color: Red/Error
   - Click Action: Navigates to `/game-setting`
   - Hover Effect: Elevates with shadow

##### B. Global Approval Control
- **Switch Toggle**: Enable/disable automatic user approval
- **Label**: "Set Upproval Status"
- **Function**: When enabled, all users are auto-approved
- **API**: `POST /api/users/all-user-info/upprove-user/`

#### State Management:
```javascript
dashData: {
  user_count: number,
  bid_count: number,
  bid_amount: number,
  game_count: number
}
upprove: boolean
```

#### API Endpoints:
- `GET /api/users/all-user-info/get-dashboard-data/` - Fetch statistics
- `GET /api/users/all-user-info/upprove-status/` - Get approval status
- `POST /api/users/all-user-info/upprove-user/` - Toggle approval

---

### 2. 👥 **User Management** (`/user`)

**Route**: `/user`  
**File**: `src/sections/user/view/user-view.jsx`  
**Purpose**: Complete user administration and monitoring

#### Features:

##### A. User List Table
- **Columns**:
  1. S.No. (Serial number)
  2. Username
  3. Name
  4. Phone (clickable - opens user details)
  5. Created At (formatted date)
  6. Approved Status (Yes/No with color coding)
  7. Change Approval Button (Approve/Unapprove)
  8. WhatsApp Link (direct messaging)
  9. Edit Button (opens full dialog)

- **Pagination**: 
  - Options: 5, 10, 25, 100, 500, 1000, All
  - Previous/Next buttons
  - Custom pagination component

##### B. Search & Filter
- **Search Bar**: Search by username, phone, or name
- **Filter Buttons**:
  - All Users
  - Unapproved Only
  - Approved Only
- Real-time filtering without API calls

##### C. User Actions (Main Table)
1. **Approve User**
   - Button: Green "Approve"
   - Shows for unapproved users
   - API: `POST /api/users/all-user-info/active/`
   - Updates `is_subscriber: true`

2. **Unapprove User**
   - Button: Red "Unapprove"
   - Shows for approved users
   - API: `POST /api/users/all-user-info/unactive/`
   - Updates `is_subscriber: false`

3. **WhatsApp Contact**
   - Icon: FontAwesome WhatsApp
   - Opens WhatsApp Web with user's phone number
   - Format: `https://api.whatsapp.com/send?phone=91{phone}`

4. **Edit User**
   - Button: Blue "Edit"
   - Opens full-screen dialog with comprehensive details

##### D. User Details Dialog (Full Screen)

**Opened by**: Clicking phone number or Edit button

###### 1. User Information Section
- **Fields**:
  - Username (read-only)
  - Name (read-only)
  - Email (read-only)
  - Phone (read-only)
  - Created At (formatted: DD-MM-YY hh:mm A)
- **Actions**:
  - WhatsApp Link
  - Call Link (`tel:+91{phone}`)

###### 2. Wallet Management
- **Field**: Wallet Points (editable number input)
- **Button**: "Update Points"
- **API**: `POST /api/users/all-user-info/update-user-wallet/`
- **Function**: Add/subtract points directly

###### 3. Password Management
- **Field**: New Password (text input)
- **Button**: "Change Password"
- **API**: `POST /api/users/all-user-info/change-password/`
- **Validation**: Cannot be empty

###### 4. Fund Deposit History Table
- **Columns**: S.No., Username, UPI ID, Created At, Amount
- **Pagination**: 5, 10, 25, All
- **API**: `POST /api/users/all-user-info/get-user-fund/`
- **Shows**: All deposits made by the user

###### 5. Withdrawal History Table
- **Columns**: S.No., Username, UPI ID, Created At, Amount
- **Pagination**: 5, 10, 25, All
- **API**: `POST /api/users/all-user-info/get-withdraw-fund/`
- **Shows**: All withdrawal requests by the user

###### 6. Bid History Table
- **Columns**: S.No., Game, Game Type, Date, Bid, Amount
- **Pagination**: 5, 10, 25, All
- **API**: `POST /api/users/all-user-info/get-bid-history/`
- **Shows**: All bids placed by the user
- **Game Type**: Displays full name (e.g., "Single Digit")

###### 7. Win History Table
- **Columns**: S.No., Game, Game Type, Date, Bid, Amount
- **Pagination**: 5, 10, 25, All
- **API**: `POST /api/users/all-user-info/get-win-history/`
- **Shows**: All winning bids by the user

#### State Management:
```javascript
userData: Array<User>           // All users
userDataCopy: Array<User>       // Backup for filtering
singleUserInfo: User            // Selected user
userFund: Array<Fund>           // Deposits
userWithdraw: Array<Withdraw>   // Withdrawals
bidHistory: Array<Bid>          // Bids
winHistory: Array<Win>          // Wins
userWalletPoints: number        // Wallet balance
```

---

### 3. 🎮 **Declare Results** (`/products`)

**Route**: `/products`  
**File**: `src/sections/products/view/products-view.jsx`  
**Purpose**: Declare game results and manage winners

#### Features:

##### A. Result Selection (Step 1)
1. **Game Dropdown**
   - Shows only games where `res_declared: false`
   - API: `GET /api/games/game-detail/`
   - Filters out already-declared results

2. **Type Dropdown**
   - Options: "Open" or "Close"
   - Open: First result of the day
   - Close: Second result of the day

3. **Next Button**
   - Validates selection
   - Proceeds to bid selection

##### B. Bid Selection (Step 2)

1. **Bid Value Dropdown**
   - 120+ predefined values (000-999)
   - Specifically curated list of valid bids
   - Different dropdown label based on type (Open/Close)

2. **Middle Digit (Auto-calculated)**
   - **Algorithm**: Sum of digits % 10
   - **Example**: 
     - Bid: 123
     - Calculation: (1 + 2 + 3) % 10 = 6
     - Mid Value: 6
   - Read-only text field
   - Updates automatically on bid selection

3. **Check Winner Button**
   - API: `POST /api/games/admin-result/search_result/`
   - **Request Body**:
     ```javascript
     {
       game_id: number,
       game_type: 'open' | 'close',
       open_bid: string (if open),
       close_bid: string (if close),
       mid_one: string (if open),
       mid_two: string (if close)
     }
     ```
   - Shows winner table if matches found

##### C. Winner Preview Table

**Displayed after**: Clicking "Check Winner"

- **Columns**:
  1. Username
  2. Game Type (Full name from `Game_sub_type`)
  3. Bid Amount
  4. Edit Bid Button

##### D. Edit Bid Dialog (Modal)

**Opened by**: Clicking "Edit" on a winner

- **Fields** (all editable):
  1. Open Single Bid
  2. Close Single Bid
  3. Open Panna Bid
  4. Close Panna Bid
  5. Jodi Bid

- **Submit Button**
  - API: `POST /api/games/admin-result/edit-bid/`
  - Updates bid values before declaration
  - Refreshes winner list

##### E. Declare Result

- **Button**: "Declare"
- **API**: `POST /api/games/admin-result/declare_result/`
- **Function**:
  - Finalizes the result
  - Credits winning amounts to user wallets
  - Marks game as `res_declared: true`
  - Triggers notifications (if configured)
- **Validation**:
  - Prevents duplicate declarations (403)
  - Validates bid format (406)

#### State Management:
```javascript
gameData: Array<Game>           // Available games
selectedGame: string            // Selected game name
selectedType: 'open' | 'close' // Result type
selectedOpenBid: string         // Bid value
midBidValue: string             // Calculated mid digit
winnerData: Array<Winner>       // Matching winners
modalData: Winner               // Selected winner for editing
```

#### Bid Value List (Partial):
`000, 100, 110, 111, 112, ..., 999` (120 values)

---

### 4. ⚙️ **Game Settings** (`/game-setting`)

**Route**: `/game-setting`  
**File**: `src/sections/gameSetting/view/gameSetting-view.jsx`  
**Purpose**: Complete game CRUD operations

#### Features:

##### A. Game List Table
- **Columns**:
  1. Game Name
  2. Open Time (formatted: hh:mm A)
  3. Close Time (formatted: hh:mm A)
  4. Result (format: `***-**-***`)
  5. Market Status (Live/Closed based on current time)
  6. Edit Button
  7. Open/Close Game Button (toggle)
  8. Delete Button

##### B. Add New Game

**Button**: "Add Game" (top-right)

**Dialog Fields**:
1. **Game Name** (text input, required)
2. **Open Time** (Time Picker with clock view)
3. **Close Time** (Time Picker with clock view)
4. **Weekend Availability**:
   - Saturday Checkbox
   - Sunday Checkbox

**Submit Button**:
- API: `POST /api/games/game-detail/`
- **Request Body**:
  ```javascript
  {
    game_name: string,
    open_time: DateTime,
    close_time: DateTime,
    live_saturday: boolean,
    live_sunday: boolean
  }
  ```
- **Auto-adjustment**: If open_time > close_time, adds 1 day to close_time

##### C. Edit Game

**Dialog Fields** (pre-filled with current values):
1. **Game Name** (editable)
2. **Open Time** (Time Picker)
3. **Close Time** (Time Picker)
4. **Live Saturday** (Checkbox)
5. **Live Sunday** (Checkbox)

**Buttons**:
- **Submit**: Updates game
  - API: `PATCH /api/games/game-detail/{id}/`
- **Reset**: Closes dialog without saving

##### D. Game Control Actions

1. **Close Game** (Red Button)
   - **Purpose**: Temporarily disable betting for this game
   - **API**: `POST /api/games/admin-info/close-game/`
   - **Body**: `{ id: number, close_game: true }`
   - **Effect**: Sets `close_game: true`, prevents new bids

2. **Open Game** (Green Button)
   - **Purpose**: Re-enable betting for this game
   - **API**: `POST /api/games/admin-info/close-game/`
   - **Body**: `{ id: number, close_game: false }`
   - **Effect**: Sets `close_game: false`, allows bids

3. **Delete Game** (Red Button)
   - **API**: `DELETE /api/games/game-detail/{id}/`
   - **Warning**: Permanent deletion
   - **Confirmation**: Alert shown

##### E. Result Display Format

**Format**: `[open]-[mid1][mid2]-[close]`

**Examples**:
- Before declaration: `***-**-***`
- After open: `123-6*-***`
- After close: `123-67-890`

**Components**:
- `open`: Opening bid (3 digits)
- `mid_one`: Calculated from open bid (1 digit)
- `mid_two`: Calculated from close bid (1 digit)
- `close`: Closing bid (3 digits)

##### F. Market Status Logic

**Calculation**: Compares current time with close_time
- **Live**: `dayjs() < dayjs(row.close_time)`
- **Closed**: `dayjs() >= dayjs(row.close_time)`

#### State Management:
```javascript
gameData: Array<Game>           // All games
currGame: Game                  // Selected for editing
newGame: Partial<Game>          // New game form data
```

---

### 5. 💰 **Withdrawal Requests** (`/withdraw`)

**Route**: `/withdraw`  
**File**: `src/sections/withdraw/view/withdraw-view.jsx`  
**Purpose**: Process user withdrawal requests

#### Features:

##### A. Date Filter
- **Component**: MUI DatePicker
- **Default**: Today's date
- **Function**: Filter requests by date range
- **Button**: "Get Withdraw requests"
- **API**: `POST /api/games/admin-info/get-withdraw-request/`
- **Request Body**:
  ```javascript
  {
    date_start: dayjs(pickedDate).startOf("D"),
    date_end: dayjs(pickedDate).endOf("D")
  }
  ```

##### B. Withdrawal Requests Table

**Columns**:
1. Username
2. UPI ID
3. Date (formatted: DD-MM-YYYY hh:mm A)
4. Amount (in rupees)
5. Points (wallet points deducted)
6. Approve Button
7. Reject Button

##### C. Row Color Coding

**Visual Status Indicators**:
- **White/Default**: Pending request
- **Green (#88E788)**: Approved request
- **Red (#FF7F7F)**: Rejected request

##### D. Actions

1. **Approve Withdrawal** (Blue Button)
   - **Shows**: Only for pending requests
   - **API**: `POST /api/games/admin-info/approve-withdraw/`
   - **Body**: `{ id: withdrawal_id }`
   - **Effect**:
     - Updates `approve: true`
     - Disables button
     - Changes row to green
   - **Alert**: Success/error message

2. **Reject Withdrawal** (Red Button)
   - **Shows**: Only for pending requests
   - **API**: `POST /api/games/admin-info/remove-withdraw/`
   - **Body**: `{ id: withdrawal_id, user: user_id }`
   - **Effect**:
     - Updates `rejected: true`
     - Refunds points to user wallet
     - Disables button
     - Changes row to red
   - **Alert**: Success/error message

3. **Disabled State**
   - Both buttons disabled after action
   - Prevents duplicate processing
   - `switchDis` state variable controls this

##### E. Request Processing Flow

```
User submits withdrawal
  ↓
Request appears in pending state (white)
  ↓
Admin clicks Approve OR Reject
  ↓
API call processes request
  ↓
Row color changes (green/red)
  ↓
Buttons become disabled
```

#### State Management:
```javascript
req: Array<WithdrawRequest>    // Withdrawal requests
pickedDate: Dayjs               // Selected date
switchDis: boolean              // Button disable state
```

#### Data Structure:
```javascript
WithdrawRequest {
  id: number,
  username: string,
  user: number,
  upi_id: string,
  amount: number,
  points: number,
  approve: boolean,
  rejected: boolean,
  created_at: DateTime
}
```

---

### 6. 💵 **Add Funds** (`/pending`)

**Route**: `/pending`  
**File**: `src/sections/pending/view/pending-view.jsx`  
**Purpose**: Manually add funds to user wallets

#### Features:

##### A. User Selection
- **Component**: React-Select (searchable dropdown)
- **API**: `GET /api/users/all-user-info/`
- **Format**: 
  ```javascript
  {
    value: username,
    label: username,
    id: user_id
  }
  ```
- **Function**: Type to search users by username
- **Placeholder**: Dropdown shows all users initially

##### B. Amount Input
- **Component**: MUI TextField
- **Type**: Number
- **Label**: "enter amount"
- **Validation**: Cannot be empty

##### C. Submit Action
- **Button**: "Submit" (outlined)
- **Validation Checks**:
  1. Points field not empty
  2. User selected
- **API**: `PUT /api/users/wallet/{user_id}/`
- **Request Body**:
  ```javascript
  {
    points: number
  }
  ```
- **Success**: Alert + form reset
- **Error**: Alert "Something went wrong"

##### D. Use Cases
- Manual fund addition for users
- Bonus points allocation
- Refunds for technical issues
- Promotional credits
- Corrections to wallet balance

#### State Management:
```javascript
req: Array<SelectOption>        // User list for dropdown
choice: SelectOption            // Selected user
points: string                  // Amount to add
```

#### Flow:
```
Admin opens Add Funds page
  ↓
Searches/selects user from dropdown
  ↓
Enters point amount
  ↓
Clicks Submit
  ↓
API updates user wallet
  ↓
Success alert shown
  ↓
Form resets
```

---

### 7. 📈 **Report Management** (`/report`)

**Route**: `/report`  
**File**: `src/sections/report/view/report-view.jsx`  
**Purpose**: View and analyze auto deposit history

#### Features:

##### A. Date Filter
- **Component**: MUI DatePicker
- **Default**: Today's date
- **Button**: "Search" (contained, primary)
- **API**: `POST /api/users/all-user-info/get-auto-deposit/`
- **Request Body**:
  ```javascript
  {
    date_start: dayjs(pickedDate).startOf("D"),
    date_end: dayjs(pickedDate).endOf("D")
  }
  ```

##### B. Total Amount Display
- **Component**: Heading (h3)
- **Format**: "Total Amount - {amount}"
- **Calculation**: Sum of all points in filtered results
- **Updates**: When date changes or data loads

##### C. Auto Deposit History Table

**Columns**:
1. S.No. (Serial number)
2. Username
3. Name (Full name of user)
4. Phone
5. UPI ID (Payment method used)
6. Created At (Time: h:m A format)
7. Amount (Points deposited)

**Pagination**:
- Options: 5, 10, 25, 50, 100, 500, 1000, All
- Custom pagination with Prev/Next buttons

##### D. Data Flow

**Auto Deposit**: Automatic payment detection system
- User makes UPI payment
- Backend detects payment via webhook
- Creates auto deposit entry
- Adds points to user wallet automatically

##### E. Report Features

1. **Historical Analysis**
   - View deposits for any date
   - Track daily revenue
   - Identify payment patterns

2. **Financial Reconciliation**
   - Match deposits with bank statements
   - Verify auto-credit accuracy
   - Audit trail for all transactions

3. **User Activity**
   - See who deposited when
   - Track payment methods (UPI IDs)
   - Monitor deposit frequency

##### F. Data Sorting
- **Default Order**: Reversed (newest first)
- Fetched data is reversed before display
- Shows latest transactions at top

#### State Management:
```javascript
userFund: Array<AutoDeposit>    // Deposit records
pickedDate: Dayjs               // Selected date
totalAmount: number             // Sum of all amounts
page: number                    // Current page
rowsPerPage: number             // Rows per page
```

#### Data Structure:
```javascript
AutoDeposit {
  id: number,
  username: string,
  name: string,
  phone: string,
  upi_id: string,
  points: number,
  created_at: DateTime
}
```

---

## 🔗 Page Interconnections

### Navigation Flows:

1. **Dashboard → User**: Click "Total Users" card
2. **Dashboard → Results**: Click "Total Bid" card
3. **Dashboard → Reports**: Click "Total Bid Amount" card
4. **Dashboard → Game Settings**: Click "Total Games" card
5. **User Page → User Details**: Click phone number or Edit button
6. **User Details → WhatsApp**: Click WhatsApp button
7. **User Details → Call**: Click Call button

### Common UI Patterns:

- **All Tables**: Material-UI Table with custom pagination
- **All Dialogs**: Full-screen or modal with close button
- **All Forms**: MUI TextFields with validation
- **All Dates**: Day.js formatting (DD-MM-YYYY hh:mm A)
- **All APIs**: Fetch with try-catch error handling

## 🔌 API Integration

### Current Status

🚧 **All API calls are currently mocked** for testing purposes. Each view file contains:
- Commented-out real API code
- Dummy data assignments

### Reconnecting Real APIs

To switch from dummy data to real API calls:

1. **Uncomment API Code**: In each view file, uncomment the `try-catch` blocks containing `fetch` calls

2. **Remove Dummy Data**: Delete or comment out the dummy data assignments

3. **Example** (from `user-view.jsx`):

```javascript
// Before (Dummy Data)
const getAllUserInfo = async () => {
    // try { ... } catch { ... }  // ← Uncommented
    
    // DUMMY DATA  // ← Remove this section
    const dummyUsers = [...]
    setUserData(dummyUsers);
};

// After (Real API)
const getAllUserInfo = async () => {
    try {
        let res = await fetch(`${API_URL}users/all-user-info/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        let data = await res.json();
        setUserData(data);
    } catch (error) {
        console.error(error);
    }
};
```

### API Endpoints Reference

#### Dashboard
- `GET /api/users/all-user-info/get-dashboard-data/`
- `GET /api/users/all-user-info/upprove-status/`
- `POST /api/users/all-user-info/upprove-user/`

#### User Management
- `GET /api/users/all-user-info/`
- `POST /api/users/all-user-info/active/`
- `POST /api/users/all-user-info/unactive/`
- `POST /api/users/all-user-info/change-password/`
- `POST /api/users/all-user-info/get-user-fund/`
- `POST /api/users/all-user-info/get-withdraw-fund/`
- `POST /api/users/all-user-info/get-bid-history/`
- `POST /api/users/all-user-info/get-win-history/`
- `POST /api/users/all-user-info/get-user-wallet/`
- `POST /api/users/all-user-info/update-user-wallet/`

#### Game Management
- `GET /api/games/game-detail/`
- `POST /api/games/game-detail/`
- `PATCH /api/games/game-detail/{id}/`
- `DELETE /api/games/game-detail/{id}/`
- `POST /api/games/admin-info/close-game/`

#### Results
- `POST /api/games/admin-result/search_result/`
- `POST /api/games/admin-result/declare_result/`
- `POST /api/games/admin-result/edit-bid/`

#### Withdrawals
- `POST /api/games/admin-info/get-withdraw-request/`
- `POST /api/games/admin-info/approve-withdraw/`
- `POST /api/games/admin-info/remove-withdraw/`

#### Funds & Reports
- `PUT /api/users/wallet/{id}/`
- `POST /api/users/all-user-info/get-auto-deposit/`

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Start with network access
npm run dev:host

# Build for production
npm run build

# Preview production build
npm run start

# Lint code
npm run lint

# Lint and fix
npm run lint:fix

# Format with Prettier
npm run prettier

# Clean install
npm run re:start
```

### Code Style

- **ESLint**: Airbnb configuration
- **Prettier**: Enabled
- **Import Order**: Enforced by eslint-plugin-perfectionist

### Helper Functions (`src/helper.js`)

```javascript
// Token Management
getToken()              // Retrieve auth token
saveToken(token)        // Save auth token with timestamp
removeToken()           // Clear auth token

// User Data
retrieveUser(id)        // Fetch user details by ID
```

## 🏗 Build & Deployment

### Production Build

```bash
npm run build
# or
yarn build
```

Build output: `dist/`

### Preview Build

```bash
npm run start
# or
yarn start
```

### Deployment Options

- **Vercel**: `vercel.json` included
- **Netlify**: `public/_redirects` included for SPA routing
- **Static Hosting**: Deploy `dist/` folder

### Environment Variables

Create `.env` file in root (if needed):

```env
VITE_API_URL=https://your-api-domain.com/api/
VITE_ROOT_URL=https://your-api-domain.com/
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## 🔐 Security Notes

⚠️ **Important**:
- Authentication is currently bypassed for development
- Enable authentication before production deployment
- Implement proper token expiration handling
- Use HTTPS in production
- Never commit sensitive credentials

## 🐛 Troubleshooting

### Port Already in Use

Change port in `vite.config.js`:
```javascript
server: {
  port: 3031, // Change to available port
}
```

### API Connection Issues

1. Verify `API_URL` in `src/variables.js`
2. Check CORS settings on backend
3. Ensure backend is running
4. Check browser console for errors

### Build Errors

```bash
# Clean and reinstall
npm run rm:all
npm install
npm run build
```

## 📝 License

MIT License - See LICENSE.md for details

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ using React + Material-UI** 
