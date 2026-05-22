import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
};

export default function ImageReveal({ children, direction = 'left', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.classList.add('img-revealed');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          ref.current?.classList.add('img-revealed');
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`img-reveal img-reveal--${direction} ${className}`}>
      {children}
    </div>
  );
}
