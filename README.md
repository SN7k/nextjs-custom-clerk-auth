# 🔐 Next.js Passwordless Authentication with Clerk

A modern, reusable authentication system built with **Next.js 14**, **Clerk**, **TypeScript**, and **Tailwind CSS**. Features passwordless email authentication, OAuth integration, and a beautiful custom UI.

## ✨ Features

- 🔑 **Passwordless Authentication** - Users sign in with just their email
- 📧 **Email Verification** - Secure OTP-based email verification
- 🔗 **OAuth Integration** - Google sign-in support
- 🎨 **Custom UI** - Beautiful, responsive design with Tailwind CSS
- 🌙 **Dark Mode** - Built-in dark/light theme toggle
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⚡ **Auto Account Creation** - New users get accounts automatically
- 🔄 **Smooth Animations** - Framer Motion animations
- 🛡️ **Route Protection** - Protected dashboard pages
- 🎯 **TypeScript** - Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account ([Get free account](https://clerk.com))

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd nextjs-clerk-auth

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Clerk API Keys (get these from https://clerk.com/dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Optional: Customize URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Clerk Dashboard Configuration

1. Go to [Clerk Dashboard](https://clerk.com/dashboard)
2. Create a new application
3. Configure **Email** authentication:
   - Go to **User & Authentication** → **Email, Phone, Username**
   - Enable **Email address**
   - Set as **Required**
   - Enable **Verification code** strategy

4. Configure **OAuth** (Optional):
   - Go to **User & Authentication** → **Social Connections**
   - Enable **Google**
   - Add your OAuth credentials

### 4. Run the Application

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 📁 Project Structure

```
├── app/
│   ├── dashboard/          # Protected dashboard pages
│   │   └── page.tsx       # Main dashboard
│   ├── login/             # Authentication pages
│   │   └── page.tsx       # Login page
│   ├── sso-callback/      # OAuth callback
│   │   └── page.tsx       # OAuth handling
│   ├── layout.tsx         # Root layout with Clerk
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Authentication components
│   │   └── sign-in-form.tsx # Main auth form
│   ├── dashboard/         # Dashboard components
│   │   └── navbar.tsx     # Navigation bar
│   └── ui/                # Reusable UI components
├── lib/
│   └── utils.ts           # Utility functions
├── middleware.ts          # Route protection
└── .env.local            # Environment variables
```

## 🔧 Core Components

### Authentication Flow

1. **Email Input** → User enters email address
2. **Account Check** → System checks if user exists
3. **OTP Verification** → User receives and enters verification code
4. **Auto Account Creation** → New users get accounts automatically
5. **Dashboard Redirect** → Successful authentication redirects to dashboard

### Key Components

#### `SignInForm` (`components/auth/sign-in-form.tsx`)
- Handles passwordless authentication
- Email verification with OTP
- Automatic account creation
- Google OAuth integration
- Loading states and error handling

#### `Dashboard` (`app/dashboard/page.tsx`)
- Protected route with user data
- Profile information display
- Route protection logic

#### `Navbar` (`components/dashboard/navbar.tsx`)
- User profile display
- Sign out functionality
- Theme toggle

## 🎨 Customization

### Styling
The project uses **Tailwind CSS** with a custom design system. Key files:
- `app/globals.css` - Global styles and CSS variables
- `tailwind.config.ts` - Tailwind configuration
- `components.json` - shadcn/ui configuration

### Themes
Built-in dark/light mode support:
```tsx
// Toggle theme in any component
<ThemeToggle />
```

### Custom UI Components
Located in `components/ui/`. Built with **Radix UI** and **shadcn/ui**:
- Buttons, inputs, cards, dialogs
- Fully accessible and customizable
- Consistent design system

## 🛡️ Security Features

### Route Protection
```tsx
// middleware.ts - Protects specific routes
export default authMiddleware({
  publicRoutes: ["/", "/login"],
  ignoredRoutes: ["/api/webhook"],
});
```

### Authentication State
```tsx
// Check auth state in any component
const { isSignedIn, user, isLoaded } = useUser();
```

### Session Management
- Automatic session handling with Clerk
- Secure token management
- Auto-refresh capabilities

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoint system**: sm, md, lg, xl
- **Touch-friendly** interfaces
- **Adaptive layouts** for all screen sizes

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
