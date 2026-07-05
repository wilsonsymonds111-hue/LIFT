const TARGET_ICON_URL = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a4a94e8e3_image.png';

export default function TargetArrowIcon({ className = 'w-6 h-6' }) {
  return (
    <img
      src={TARGET_ICON_URL}
      alt="Goal target"
      className={className}
      style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
      draggable={false}
    />
  );
}