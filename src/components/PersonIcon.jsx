const ICON_URL = "https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6f33635b2_generated_image.png";

export default function PersonIcon({ className, strokeWidth }) {
  return (
    <img
      src={ICON_URL}
      alt="Body Stats"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}