import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { ToastProvider, useToast } from './components/common/Toast.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { BottomNav } from './components/layout/BottomNav.js';
import { DiscoverPlansPage } from './pages/DiscoverPlansPage.js';
import { CreatePlanPage } from './pages/CreatePlanPage.js';
import { PlanDetailsPage } from './pages/PlanDetailsPage.js';
import { JoinRequestsPage } from './pages/JoinRequestsPage.js';
import { ConnectionsPage } from './pages/ConnectionsPage.js';
import { ChatPage } from './pages/ChatPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { UserProfilePage } from './pages/UserProfilePage.js';
import { MyPlansPage } from './pages/MyPlansPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { Modal } from './components/common/Modal.js';
import { api } from './services/api.js';
import { Plan } from './types/index.js';
import {
  Sparkles,
  Phone,
  Lock,
  User as UserIcon,
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, login, register, logout } = useAuth();
  const { showToast } = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('discover');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);
  const [initialConnectionId, setInitialConnectionId] = useState<string | undefined>(undefined);
  const [createPlanInit, setCreatePlanInit] = useState<{
    initialLocation?: string;
    initialCategory?: any;
    initialTitle?: string;
  }>({});

  // Auth Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Navigation handler
  const handleNavigate = (tab: string, extra?: unknown) => {
    if (tab === 'auth') {
      setIsAuthModalOpen(true);
      setAuthMode('login');
      return;
    }

    if (tab === 'details' && extra) {
      setSelectedPlan(extra as Plan);
      setCurrentTab('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'create') {
      if (extra && typeof extra === 'object') {
        setCreatePlanInit(extra as { initialLocation?: string; initialCategory?: any; initialTitle?: string });
      } else {
        setCreatePlanInit({});
      }
    }

    if (tab === 'chat' && extra && typeof extra === 'object' && 'connectionId' in extra) {
      setInitialConnectionId((extra as { connectionId?: string }).connectionId);
    }

    if (tab === 'profile') {
      if (extra && typeof extra === 'string') {
        setTargetUserId(extra);
      } else {
        setTargetUserId(undefined);
      }
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUser = (userId: string) => {
    setTargetUserId(userId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !password) {
      showToast({
        title: 'Required',
        message: 'Please enter phone number and password.',
        type: 'error',
      });
      return;
    }

    setIsAuthLoading(true);

    try {
      const res = await login(phone.trim(), password);

      if (res.success && res.token && res.user) {
        setIsAuthModalOpen(false);
        setPhone('');
        setPassword('');
        showToast({
          title: 'Logged in successfully! 🚀',
          message: `Welcome back, ${res.user.name || 'Explorer'}!`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Login Failed',
          message: res.error || 'Invalid credentials.',
          type: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        message: 'Something went wrong. Please check your details.',
        type: 'error',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !password || !name) {
      showToast({
        title: 'Required',
        message: 'Name, phone, and password are required.',
        type: 'error',
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        title: 'Weak Password',
        message: 'Password must be at least 6 characters.',
        type: 'error',
      });
      return;
    }

    setIsAuthLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        age: age ? parseInt(age, 10) : undefined,
        bio: bio.trim(),
        location: location.trim() || 'Bengaluru',
      });

      if (res.success) {
        showToast({
          title: 'Welcome to PlanMate! 🎉',
          message: 'Your account is ready. Discover and create spontaneous plans!',
          type: 'success',
        });

        setIsAuthModalOpen(false);
        setName('');
        setPassword('');
        setPhone('');
        setAge('');
        setBio('');
        setLocation('');
      } else {
        showToast({
          title: 'Registration Failed',
          message: res.error || 'Could not register.',
          type: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        message: 'Something went wrong during registration.',
        type: 'error',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuthModal={() => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenUser={handleOpenUser}
      />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex gap-6 items-start">
          {/* Desktop Bento Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-20">
            <Sidebar
              currentTab={currentTab}
              onNavigate={handleNavigate}
              onOpenAuthModal={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              onLogout={logout}
            />
          </div>

          {/* Main App Content View */}
          <main className="flex-1 min-w-0 w-full">
            {currentTab === 'discover' && (
              <DiscoverPlansPage
                onSelectPlan={handleSelectPlan}
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'details' && selectedPlan && (
              <PlanDetailsPage
                planId={selectedPlan.id}
                onBack={() => setCurrentTab('discover')}
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'create' && (
              <CreatePlanPage
                key={createPlanInit.initialLocation || 'create_plan_default'}
                initialLocation={createPlanInit.initialLocation}
                initialCategory={createPlanInit.initialCategory}
                initialTitle={createPlanInit.initialTitle}
                onPlanCreated={(plan) => {
                  setSelectedPlan(plan);
                  setCurrentTab('details');
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'my-plans' && (
              <MyPlansPage
                onSelectPlan={handleSelectPlan}
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'requests' && (
              <JoinRequestsPage
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'connections' && (
              <ConnectionsPage
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'chat' && (
              <ChatPage
                initialConnectionId={initialConnectionId}
                onNavigate={handleNavigate}
                onOpenUser={handleOpenUser}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationsPage
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'profile' && (
              <UserProfilePage
                userId={targetUserId}
                onSelectPlan={handleSelectPlan}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'auth' && (
              <div className="max-w-md mx-auto py-8 px-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                      Sign in to PlanMate
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Explore Navi Mumbai & join hangouts, turf sports & cafes
                    </p>
                  </div>

                  {/* Form Trigger */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Sign In with Phone & Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all cursor-pointer"
                    >
                      Create New Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
      />

      {/* Auth Modal (Login / Register) */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Top Auth Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
              {authMode === 'login' && <Sparkles className="w-6 h-6" />}
              {authMode === 'register' && <Compass className="w-6 h-6" />}
            </div>

            <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">
              {authMode === 'login' ? 'Welcome Back' : 'Join the Squad'}
            </h3>

            <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
              {authMode === 'login'
                ? 'Enter your phone & password to continue.'
                : 'Create your Gen-Z social profile with instant access.'}
            </p>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="tel"
                    id="login-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-login-btn"
                  disabled={isAuthLoading}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  id="switch-to-register-btn"
                  onClick={() => setAuthMode('register')}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>

                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    id="register-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone *
                  </label>

                  <input
                    type="tel"
                    id="register-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Age
                  </label>

                  <input
                    type="number"
                    id="register-age-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="22"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password * (Min 6 chars)
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  City / Location
                </label>

                <input
                  type="text"
                  id="register-location-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Bio / Tagline
                </label>

                <textarea
                  rows={2}
                  id="register-bio-input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Coffee lover, weekend turf striker & concert junkie!"
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-register-btn"
                  disabled={isAuthLoading}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    'Creating Profile...'
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  id="switch-to-login-btn"
                  onClick={() => setAuthMode('login')}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
