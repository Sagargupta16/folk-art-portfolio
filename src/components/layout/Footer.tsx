import { brand, contact } from '@/lib/site';
import { Instagram, Whatsapp, Mail } from '@/components/ui/icons';

const BASE = import.meta.env.BASE_URL;
const logoUrl = `${BASE}${brand.logo}`;
const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)]">
      <div className="container-x flex flex-col items-center justify-between gap-5 py-10 sm:flex-row sm:gap-4">
        <a href="#top" className="group flex items-center gap-3" aria-label={`${brand.logoAlt} -- back to top`}>
          <img
            src={logoUrl}
            alt=""
            width="48"
            height="48"
            loading="lazy"
            decoding="async"
            className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--color-line)] transition group-hover:ring-[var(--color-accent)]"
          />
          <span
            className="t-display text-xl text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]"
            aria-hidden="true"
          >
            {brand.headline.latinPrefix}
            <span lang="hi" className="font-devanagari not-italic text-[var(--color-accent)]">
              {brand.headline.devanagariCore}
            </span>
          </span>
        </a>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            className="t-meta inline-flex items-center gap-2 transition hover:text-[var(--color-accent)]"
            href={contact.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <Instagram size={16} />
            <span>Instagram</span>
          </a>
          <a
            className="t-meta inline-flex items-center gap-2 transition hover:text-[var(--color-accent)]"
            href={contact.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <Whatsapp size={16} />
            <span>WhatsApp</span>
          </a>
          <a
            className="t-meta inline-flex items-center gap-2 transition hover:text-[var(--color-accent)]"
            href={contact.email.url}
            aria-label="Email"
          >
            <Mail size={16} />
            <span>Email</span>
          </a>
          <span className="t-meta">&copy; {year}</span>
        </div>
      </div>
    </footer>
  );
}
