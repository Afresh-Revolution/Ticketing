import { useEffect, useRef, type ReactNode } from 'react';

type ScrollRevealProps = {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'fadeInUp';
  stagger?: boolean;
  className?: string;
  rootMargin?: string;
  threshold?: number;
};

const ScrollReveal = ({
  children,
  animation = 'fadeInUp' /* consistent across site */,
  stagger = false,
  className = '',
  rootMargin = '0px 0px -40px 0px',
  threshold = 0.1,
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal${stagger ? ' scroll-reveal-stagger' : ''} ${className}`.trim()}
      data-animate={animation}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
