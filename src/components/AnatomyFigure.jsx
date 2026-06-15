const ANATOMY_IMAGES = {
  push: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/3936fa5c4_generated_image.png',
  pull: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/8a0af3450_generated_image.png',
  legs: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/29eb23522_generated_image.png',
  upper: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/4182610d1_generated_image.png',
  lower: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/535c469ee_generated_image.png',
  full: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/b26c82ca2_generated_image.png',
};

export default function AnatomyFigure({ variant, size = 'md' }) {
  const src = ANATOMY_IMAGES[variant];
  if (!src) return null;

  const sizes = { sm: 150, md: 180, lg: 220 };
  const px = sizes[size] || sizes.md;

  return (
    <img
      src={src}
      alt={variant}
      width={px}
      height={px}
      className="object-contain mx-auto"
      style={{ width: px, height: px }}
    />
  );
}