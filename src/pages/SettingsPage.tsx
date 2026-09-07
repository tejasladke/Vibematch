import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
  HeartHandshake,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';
import { api } from '../services/api.js';

interface SettingsPageProps {
  onNavigate: (tab: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate: _onNavigate }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // Notification toggles
  const [notifJoinRequests, setNotifJoinRequests] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPlanUpdates, setNotifPlanUpdates] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast({ title: 'Missing fields', message: 'Please fill out all password fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ title: 'Weak password', message: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Mismatch', message: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        showToast({ title: 'Password updated', message: 'Your password has been changed successfully.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast({ title: 'Update failed', message: res.error || 'Incorrect current password.', type: 'error' });
      }
    } catch {
      showToast({ title: 'Error', message: 'Could not change password.', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await api.updateNotificationPreferences({
        joinRequests: notifJoinRequests,
        messages: notifMessages,
        planUpdates: notifPlanUpdates,
        sound: notifSound,
      });
      showToast({ title: 'Preferences Saved', message: 'Notification settings updated.', type: 'success' });
    } catch {
      showToast({ title: 'Error', message: 'Failed to update preferences.', type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header Bento Tile */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Account & Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
            Settings & Community Safety
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your account security, notification preferences, and review safety guidelines.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={logout}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bento Box 1: Notification Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-display">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Notification Alerts</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure which alerts trigger in-app popups and notification sounds.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Join Request Alerts</span>
                  <span className="text-[11px] text-slate-500">When someone asks to join your plans</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifJoinRequests}
                  onChange={(e) => setNotifJoinRequests(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Direct Chat Messages</span>
                  <span className="text-[11px] text-slate-500">When squad members message you</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifMessages}
                  onChange={(e) => setNotifMessages(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Plan Status Updates</span>
                  <span className="text-[11px] text-slate-500">When your join requests get approved</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPlanUpdates}
                  onChange={(e) => setNotifPlanUpdates(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Audio & Chime</span>
                  <span className="text-[11px] text-slate-500">Play subtle sound on new live message</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifSound}
                  onChange={(e) => setNotifSound(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveNotifications}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Save Notification Settings
          </button>
        </div>

        {/* Bento Box 2: Password & Auth Security */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-display">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>Change Password</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ensure your account is protected with a secure password.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted with bcrypt & secured JWT tokens</span>
          </div>
        </div>

        {/* Bento Box 3: Community Safety Guidelines (Spans 2 columns on medium+ screens) */}
        <div className="md:col-span-2 bg-linear-to-br from-indigo-900 via-slate-900 to-violet-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-extrabold font-display">
                PlanMate Safety & Squad Etiquette
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              We design PlanMate for genuine, respectful, and safe real-world hangouts. Follow these 4 simple pillars:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 mb-2">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Public Meetups First</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Always choose well-lit public spots like malls, cafés, and registered sports turfs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Transparent Cost Split</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Discuss and confirm budget splits in private chat before showing up.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Zero Tolerance Abuse</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Instantly block and report any inappropriate or disrespectful behavior.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-sky-500/30 flex items-center justify-center text-sky-300 mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Show Up on Time</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Reliability builds trust. Inform the host early if plans or timings change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
