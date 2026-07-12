import { useState, useEffect, memo } from 'react';
import { UserCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ProfileSheet from './ProfileSheet';

const ProfileButton = memo(function ProfileButton({ bodyStatsProps }) {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, isAuthenticated } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState(() => user?.profilePhoto || null);

  // Sync cloud photo when auth user becomes available; clear when logged out
  useEffect(() => {
    if (isAuthenticated && user?.profilePhoto) {
      setProfilePhoto(user.profilePhoto);
    } else if (!isAuthenticated) {
      setProfilePhoto(null);
    }
  }, [user, isAuthenticated]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    if (isAuthenticated) {
      base44.auth.updateMe({ darkMode: next }).catch(() => {});
    } else {
      localStorage.setItem('darkMode', String(next));
    }
  };

  const handlePhotoChange = (url) => {
    setProfilePhoto(url);
  };

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="w-12 h-12 rounded-full overflow-hidden shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-150 flex-shrink-0"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary">
            <UserCircle className="w-6 h-6 text-primary-foreground" />
          </div>
        )}
      </button>

      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
          profilePhoto={profilePhoto}
          onPhotoChange={handlePhotoChange}
          bodyStatsProps={bodyStatsProps}
        />
      )}
    </>
  );
});

export default ProfileButton;