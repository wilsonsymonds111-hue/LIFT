import { useState, useEffect, memo } from 'react';
import { UserCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSheet from './ProfileSheet';

const ProfileButton = memo(function ProfileButton() {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [autoDarkMode, setAutoDarkMode] = useState(() => localStorage.getItem('autoDarkMode') !== 'false');
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);
  const [loaded, setLoaded] = useState(true);

  useEffect(() => {
    // Try to get cloud profile photo, fall back to local
    base44.auth.me().then(user => {
      if (user?.profilePhoto) {
        setProfilePhoto(user.profilePhoto);
        localStorage.setItem('profilePhoto', user.profilePhoto);
      }
    }).catch(() => {
      // Guest mode – use localStorage photo (already loaded)
    });
  }, []);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  const handleToggleAuto = () => {
    const next = !autoDarkMode;
    setAutoDarkMode(next);
    localStorage.setItem('autoDarkMode', String(next));
    if (next) {
      // Auto mode on: apply time-based
      const hour = new Date().getHours();
      const isNight = hour >= 19 || hour < 7;
      document.documentElement.classList.toggle('dark', isNight);
      setDarkMode(isNight);
    } else {
      // Auto mode off: apply manual preference
      const manual = localStorage.getItem('darkMode') === 'true';
      document.documentElement.classList.toggle('dark', manual);
      setDarkMode(manual);
    }
  };

  const handlePhotoChange = (url) => {
    setProfilePhoto(url);
    localStorage.setItem('profilePhoto', url);
  };

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="w-10 h-10 rounded-full overflow-hidden shadow-md hover:shadow-lg hover:scale-110 hover:ring-2 hover:ring-blue-400/50 active:scale-95 transition-all duration-150 flex-shrink-0 border-2 border-border hover:border-blue-400/30"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary">
            <UserCircle className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </button>

      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          darkMode={darkMode}
          autoDarkMode={autoDarkMode}
          onToggleDark={handleToggleDark}
          onToggleAuto={handleToggleAuto}
          profilePhoto={profilePhoto}
          onPhotoChange={handlePhotoChange}
        />
      )}
    </>
  );
});

export default ProfileButton;