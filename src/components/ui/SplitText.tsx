import { useEffect, useRef } from 'react';

type Props = {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
};

export default function SplitText({ children, className = '', as: Tag = 'span', delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.classList.add('split-visible');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            ref.current?.classList.add('split-visible');
          }, delay);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [delay]);

  const chars = children.split('');

  return (
    <Tag ref={ref as React.Ref<never>} className={`split-text ${className}`} aria-label={children}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="split-char"
          style={{ '--char-index': i } as React.CSSProperties}
          aria-hidden="true"
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </Tag>
  );
}
