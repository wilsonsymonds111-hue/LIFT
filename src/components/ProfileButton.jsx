import { useState, useEffect, memo } from 'react';
import { UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ProfileSheet from './ProfileSheet';

const ProfileButton = memo(function ProfileButton({ bodyStatsProps }) {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || user?.profilePhoto || null);

  // Sync cloud photo when auth user becomes available; clear when logged out
  useEffect(() => {
    if (user?.profilePhoto) {
      setProfilePhoto(user.profilePhoto);
      localStorage.setItem('profilePhoto', user.profilePhoto);
    } else if (!user) {
      setProfilePhoto(null);
      localStorage.removeItem('profilePhoto');
    }
  }, [user]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  const handlePhotoChange = (url) => {
    setProfilePhoto(url);
    localStorage.setItem('profilePhoto', url);
  };

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="w-12 h-12 rounded-full overflow-hidden shadow-md hover:shadow-lg hover:scale-110 hover:ring-2 hover:ring-blue-400/50 active:scale-95 transition-all duration-150 flex-shrink-0 border-2 border-border hover:border-blue-400/30"
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