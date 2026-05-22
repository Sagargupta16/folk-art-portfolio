import Section from '@/components/layout/Section';
import { contact, sections } from '@/lib/site';
import { useTilt3D } from '@/hooks/useTilt3D';
import siteData from '@/data/site.json';

type Workshop = {
  slug: string;
  title: string;
  blurb: string;
  durationHours?: number;
  order: number;
};

const items = (siteData.workshops as Workshop[]).sort((a, b) => a.order - b.order);
const w = sections.workshops;

function WorkshopCard({ item }: { item: Workshop }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt3D({ maxAngle: 5, scale: 1.02 });
  return (
    <li className="reveal">
      <article
        ref={ref as React.Ref<HTMLElement>}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="card card-tilt border-beam tilt-3d h-full"
      >
        <h3 className="t-display text-2xl text-[var(--color-ink)]">{item.title}</h3>
        <p className="t-body text-[var(--color-muted)]">{item.blurb}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          {item.durationHours ? (
            <span
              className="t-meta rounded-full px-2.5 py-1"
              style={{ background: 'color-mix(in srgb, var(--section-accent) 14%, transparent)', color: 'var(--section-accent)' }}
            >
              {item.durationHours}h session
            </span>
          ) : (
            <span />
          )}
          <a
            className="t-meta transition hover:underline"
            style={{ color: 'var(--section-accent)' }}
            href={contact.email.url}
          >
            Enquire -&gt;
          </a>
        </div>
      </article>
    </li>
  );
}

export default function Workshops() {
  return (
    <Section id="workshops" eyebrow={w.eyebrow} title={w.title} lead={w.lead} accent="var(--style-pichwai)">
      <ul className="stagger grid gap-[var(--grid-gap)] md:grid-cols-2">
        {items.map((item) => (
          <WorkshopCard key={item.slug} item={item} />
        ))}
      </ul>
    </Section>
  );
}
