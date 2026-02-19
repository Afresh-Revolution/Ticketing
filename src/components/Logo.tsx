import { useState } from 'react';

import logoMain from '../assets/logo-main.png';

type LogoVariant = 'main' | 'sec';

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
  /** Height in px for the image. */
  height?: number;
}

const DEFAULT_HEIGHT_MAIN = 60;
const DEFAULT_HEIGHT_SEC = 54;

export default function Logo({
  variant = 'main',
  className = '',
  alt = 'Gatewave',
  height,
}: LogoProps) {
  const h = height ?? (variant === 'sec' ? DEFAULT_HEIGHT_SEC : DEFAULT_HEIGHT_MAIN);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: `${h}px`,
          fontSize: `${Math.max(12, h * 0.4)}px`,
          fontWeight: 600,
          color: 'inherit',
        }}
      >
        {alt}
      </span>
    );
  }

  return (
    <img
      src={logoMain}
      alt={alt}
      className={className}
      style={{ height: `${h}px`, width: 'auto', display: 'block', objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
}
