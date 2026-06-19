import { useState, memo } from 'react';
import { UserCircle } from 'lucide-react';
import ProfileSheet from './ProfileSheet';

const ProfileButton = memo(function ProfileButton() {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  const handlePhotoChange = (url) => {
    setProfilePhoto(url);
  };

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="w-10 h-10 rounded-full overflow-hidden shadow-md hover:shadow-lg hover:scale-110 hover:ring-2 hover:ring-blue-400/50 active:scale-95 transition-all duration-150 flex-shrink-0 border-2 border-border hover:border-blue-400/30"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
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
          onToggleDark={handleToggleDark}
          profilePhoto={profilePhoto}
          onPhotoChange={handlePhotoChange}
        />
      )}
    </>
  );
});

export default ProfileButton;