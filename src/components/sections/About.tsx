import Section from '@/components/layout/Section';
import { brand, sections } from '@/lib/site';

const a = sections.about;

export default function About() {
  return (
    <Section id="about" eyebrow={a.eyebrow} title={a.title} accent="var(--color-marigold)">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="stagger space-y-5 md:col-span-8">
          {a.paragraphs.map((p: string, i: number) => (
            <p key={i} className={`t-body reveal${i === 0 ? ' drop-cap' : ''}`}>{p}</p>
          ))}
          <blockquote className="reveal mt-8 border-l-2 pl-5" style={{ borderColor: 'var(--section-accent)' }}>
            <p className="t-display text-2xl sm:text-3xl" style={{ color: 'var(--section-accent)' }}>
              {a.pullQuote}
            </p>
          </blockquote>
          <p className="reveal mt-2 text-right" aria-hidden="true">
            <span
              lang="hi"
              className="font-devanagari text-3xl"
              style={{ color: 'color-mix(in srgb, var(--section-accent) 70%, var(--color-muted))' }}
            >
              इति
            </span>
          </p>
        </div>
        <aside className="stagger space-y-3 md:col-span-4">
          <p className="t-meta reveal">Based in</p>
          <p className="t-body reveal">{brand.location}</p>
          <p className="t-meta reveal mt-6">{a.asideHeading}</p>
          <p className="t-body reveal">{a.asideBody}</p>
        </aside>
      </div>
    </Section>
  );
}
