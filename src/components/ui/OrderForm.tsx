import { useState } from 'react';

type Props = {
  styles: readonly string[];
  sizes: readonly string[];
  budgets: readonly string[];
  timelines: readonly string[];
  whatsappNumber: string;
  emailUrl: string;
  submitLabel: string;
  fallbackEmailLabel: string;
};

type FormState = {
  name: string;
  style: string;
  size: string;
  budget: string;
  timeline: string;
  notes: string;
};

const EMPTY: FormState = {
  name: '',
  style: '',
  size: '',
  budget: '',
  timeline: '',
  notes: '',
};

const LABEL_CLASSES = 't-eyebrow mb-1.5 block text-[var(--color-muted)]';

function buildMessage(form: FormState): string {
  const lines = [
    'Hi Megha, I would like to order a custom painting.',
    '',
    `Name: ${form.name || '--'}`,
    `Style: ${form.style || 'Open to suggestion'}`,
    `Size: ${form.size || '--'}`,
    `Budget: ${form.budget || '--'}`,
    `Timeline: ${form.timeline || '--'}`,
    '',
    'Notes:',
    form.notes.trim() || '--',
  ];
  return lines.join('\n');
}

function buildEmailUrl(emailUrl: string, form: FormState): string {
  const namePart = form.name ? ` -- ${form.name}` : '';
  const subject = `Custom order${namePart}`;
  const body = buildMessage(form);
  const params = new URLSearchParams({ subject, body });
  return `${emailUrl}?${params.toString()}`;
}

export default function OrderForm({
  styles,
  sizes,
  budgets,
  timelines,
  whatsappNumber,
  emailUrl,
  submitLabel,
  fallbackEmailLabel,
}: Readonly<Props>) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = encodeURIComponent(buildMessage(form));
    const url = `https://wa.me/${whatsappNumber}?text=${text}`;
    /* Celebrate the handoff visually -- the form persists so the user can
       resend if WhatsApp is blocked. The confetti animation runs ~700ms; we
       reset state at 1.2s so a second submit re-triggers the burst. */
    setIsCelebrating(true);
    window.setTimeout(() => setIsCelebrating(false), 1200);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isReady = form.name.trim().length > 0 && form.size.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      className={`relative grid gap-5 sm:grid-cols-2${isCelebrating ? ' is-celebrating' : ''}`}
    >
      <label className="sm:col-span-2">
        <span className={LABEL_CLASSES}>Your name</span>
        <input
          type="text"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="field-input"
          placeholder="e.g. Priya"
        />
      </label>

      <label>
        <span className={LABEL_CLASSES}>Style</span>
        <select
          value={form.style}
          onChange={(e) => update('style', e.target.value)}
          className="field-select"
        >
          <option value="">Open to suggestion</option>
          {styles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className={LABEL_CLASSES}>Size</span>
        <select
          required
          value={form.size}
          onChange={(e) => update('size', e.target.value)}
          className="field-select"
        >
          <option value="">Choose a size</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className={LABEL_CLASSES}>Budget</span>
        <select
          value={form.budget}
          onChange={(e) => update('budget', e.target.value)}
          className="field-select"
        >
          <option value="">Open / not sure</option>
          {budgets.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className={LABEL_CLASSES}>Timeline</span>
        <select
          value={form.timeline}
          onChange={(e) => update('timeline', e.target.value)}
          className="field-select"
        >
          <option value="">No rush</option>
          {timelines.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className={LABEL_CLASSES}>Notes</span>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="field-textarea"
          placeholder="Subject, palette, room it lives in, any reference images you'll share on chat..."
        />
      </label>

      <div className="relative flex flex-col items-center gap-3 pt-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-auto">
          {/* Saturated submit -- paints in the section accent (vermillion in
             Custom Orders) so the call-to-action carries the section's warmth.
             The confetti burst sits behind the button and overflows freely. */}
          <span className="celebrate-burst" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span />
          </span>
          <button
            type="submit"
            disabled={!isReady}
            className="t-meta relative inline-flex min-h-[48px] w-full items-center justify-center gap-2 border px-6 py-3.5 transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            style={{
              background: 'var(--section-accent, var(--color-ink))',
              borderColor: 'var(--section-accent, var(--color-ink))',
              color: 'var(--color-bg)',
            }}
          >
            {submitLabel} -&gt;
          </button>
        </div>
        <a
          href={buildEmailUrl(emailUrl, form)}
          className="t-meta inline-flex min-h-[44px] items-center px-2 py-2 text-[var(--color-muted)] transition hover:text-[var(--section-accent)]"
        >
          {fallbackEmailLabel}
        </a>
      </div>
    </form>
  );
}
