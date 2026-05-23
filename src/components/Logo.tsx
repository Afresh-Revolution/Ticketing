import logoMainSrc from '../assets/branding/logo-main.png';
import logoIconSrc from '../assets/branding/logo.png';

type LogoVariant = 'main' | 'icon';

interface LogoProps {
  /** `main` = full wordmark; `icon` = G mark only */
  variant?: LogoVariant;
  className?: string;
  alt?: string;
  /** Height in px for the image. */
  height?: number;
}

const LOGO_SRC: Record<LogoVariant, string> = {
  main: logoMainSrc,
  icon: logoIconSrc,
};

const DEFAULT_HEIGHT: Record<LogoVariant, number> = {
  main: 60,
  icon: 40,
};

export default function Logo({
  variant = 'main',
  className = '',
  alt = 'Gatewav',
  height,
}: LogoProps) {
  const h = height ?? DEFAULT_HEIGHT[variant];
  const src = LOGO_SRC[variant];

  const style =
    height != null
      ? { height: `${h}px`, width: 'auto', display: 'block', objectFit: 'contain' as const }
      : { width: 'auto', display: 'block', objectFit: 'contain' as const };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={variant === 'main' ? undefined : h}
      height={height != null ? h : undefined}
      style={style}
      decoding="async"
    />
  );
}
