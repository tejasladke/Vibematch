import React, { useState, useEffect, useCallback } from 'react';
import { Plan, User } from '../types/index.js';
import { api } from '../services/api.js';
import { PlanCard } from '../components/plans/PlanCard.js';
import { Modal } from '../components/common/Modal.js';
import {
  MapPin,
  Calendar,
  Sparkles,
  Edit3,
  Instagram,
  Twitter,
  Linkedin,
  Compass,
  CheckCircle2,
  Phone,
  CalendarDays,
  UserRoundCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';

interface UserProfilePageProps {
  userId?: string;
  onSelectPlan: (plan: Plan) => void;
  onNavigate: (tab: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userId,
  onSelectPlan,
  onNavigate,
}) => {
  const { user: currentUser, updateUser } = useAuth();
  const { showToast } = useToast();

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]);
  const [joinedPlans, setJoinedPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<{ createdCount: number; joinedCount: number }>({
    createdCount: 0,
    joinedCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Edit form state
  const [editName, setEditName] = useState<string>('');
  const [editAge, setEditAge] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editInterests, setEditInterests] = useState<string>('');
  const [editInstagram, setEditInstagram] = useState<string>('');
  const [editTwitter, setEditTwitter] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      const res = await api.getUserProfile(targetUserId);
      if (res.success && res.data) {
        setProfileUser(res.data.user);
        setCreatedPlans(res.data.createdPlans || []);
        setJoinedPlans(res.data.joinedPlans || []);
        setStats(res.data.stats || { createdCount: 0, joinedCount: 0 });

        if (isOwnProfile) {
          setEditName(res.data.user.name || '');
          setEditAge(res.data.user.age?.toString() || '');
          setEditBio(res.data.user.bio || '');
          setEditLocation(res.data.user.location || '');
          setEditInterests(res.data.user.interests?.join(', ') || '');
          setEditInstagram(res.data.user.socialLinks?.instagram || '');
          setEditTwitter(res.data.user.socialLinks?.twitter || '');
          setEditAvatar(res.data.user.avatar || '');
        }
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const interestsArray = editInterests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      const res = await api.updateProfile({
        name: editName.trim(),
        age: editAge ? parseInt(editAge, 10) : undefined,
        bio: editBio.trim(),
        location: editLocation.trim(),
        interests: interestsArray,
        avatar: editAvatar.trim(),
        socialLinks: {
          instagram: editInstagram.trim(),
          twitter: editTwitter.trim(),
        },
      });

      if (res.success && res.data) {
        updateUser(res.data);
        setProfileUser(res.data);
        showToast({ title: 'Profile Updated! ✨', message: 'Your changes have been saved.', type: 'success' });
        setIsEditModalOpen(false);
      }
    } catch {
      showToast({ title: 'Error', message: 'Failed to update profile', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-56 rounded-3xl bg-slate-200" />
        <div className="h-32 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>User profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner backdrop */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 relative">
          {isOwnProfile && (
            <button
              type="button"
              id="edit-profile-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile info section */}
        <div className="px-5 sm:px-7 pb-7 pt-0 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 -mt-14 mb-5">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt={`${profileUser.name}'s profile`}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-lg bg-slate-100"
                  />
                ) : (
                  <div
                    aria-label={`${profileUser.name}'s profile`}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-black"
                  >
                    {(profileUser.name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('')}
                  </div>
                )}
                <span
                  title="PlanMate profile"
                  className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-white rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </span>
              </div>

              <div className="pb-1 hidden sm:block">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold uppercase tracking-wide">
                  <UserRoundCheck className="w-3 h-3" />
                  {isOwnProfile ? 'Your profile' : 'PlanMate member'}
                </div>
              </div>
            </div>

            {/* Real account activity stats */}
            <div className="grid grid-cols-2 gap-2.5 w-full lg:w-auto">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[112px]">
                <p className="text-xl font-extrabold text-indigo-600 font-display">
                  {stats.createdCount}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                  Hosted Plans
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[112px]">
                <p className="text-xl font-extrabold text-slate-900 font-display">
                  {stats.joinedCount}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                  Squads Joined
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                {profileUser.name}
              </h2>
              {profileUser.age !== undefined && profileUser.age > 0 && (
                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {profileUser.age} yrs
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              {profileUser.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {profileUser.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                {(() => {
                  const digits = (profileUser.phone || '').replace(/\D/g, '');
                  if (!digits) return 'Phone not available';
                  if (digits.length === 10) return `+91 ${digits.slice(0, 2)}••••${digits.slice(-4)}`;
                  if (digits.length > 10) return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -8)}••••${digits.slice(-4)}`;
                  return `••••${digits.slice(-4)}`;
                })()}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-violet-500" />
                Member since {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {profileUser.bio ? (
              <p className="text-xs sm:text-sm text-slate-700 mt-4 leading-relaxed max-w-2xl">
                {profileUser.bio}
              </p>
            ) : isOwnProfile ? (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Add a short bio so people know what you are into →
              </button>
            ) : null}

            {/* Interests Chips */}
            {profileUser.interests && profileUser.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {profileUser.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{interest}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Social Links */}
            {(profileUser.socialLinks?.instagram || profileUser.socialLinks?.twitter || profileUser.socialLinks?.linkedin) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                {profileUser.socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${profileUser.socialLinks.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" /> @{profileUser.socialLinks.instagram.replace(/^@/, '')}
                  </a>
                )}
                {profileUser.socialLinks?.twitter && (
                  <a
                    href={`https://x.com/${profileUser.socialLinks.twitter.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" /> @{profileUser.socialLinks.twitter.replace(/^@/, '')}
                  </a>
                )}
                {profileUser.socialLinks?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profileUser.socialLinks.linkedin.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            )}

            {/* Profile completeness for the logged-in user */}
            {isOwnProfile && (() => {
              const fields = [
                Boolean(profileUser.name),
                Boolean(profileUser.avatar),
                Boolean(profileUser.age),
                Boolean(profileUser.location),
                Boolean(profileUser.bio),
                Boolean(profileUser.interests?.length),
                Boolean(profileUser.socialLinks?.instagram || profileUser.socialLinks?.twitter || profileUser.socialLinks?.linkedin),
              ];
              const complete = Math.round((fields.filter(Boolean).length / fields.length) * 100);
              return (
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Profile strength</p>
                      <p className="text-[11px] text-slate-500">Complete profiles make it easier for people to trust your plans.</p>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700">{complete}%</span>
                  </div>
                  <div className="h-2 bg-white/80 rounded-full overflow-hidden border border-indigo-100">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${complete}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Plans Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            id="tab-user-created"
            onClick={() => setActiveTab('created')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'created'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Hosted Activities ({createdPlans.length})</span>
          </button>

          <button
            type="button"
            id="tab-user-joined"
            onClick={() => setActiveTab('joined')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'joined'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Squads Attending ({joinedPlans.length})</span>
          </button>
        </div>

        {activeTab === 'created' ? (
          createdPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createdPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={onSelectPlan}
                  onRequestSuccess={fetchProfile}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 p-6">
              No hosted activities yet.
            </div>
          )
        ) : joinedPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={onSelectPlan}
                onRequestSuccess={fetchProfile}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 p-6">
            Not attending other squads yet.
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Profile"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Avatar Photo URL
              </label>
              <input
                type="url"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Koramangala, Bengaluru"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bio / Tagline
              </label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Interests (Comma separated)
              </label>
              <input
                type="text"
                value={editInterests}
                onChange={(e) => setEditInterests(e.target.value)}
                placeholder="Café, Movies, Football, Trekking..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-profile-btn"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
