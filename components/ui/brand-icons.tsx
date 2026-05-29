/**
 * Brand glyphs for third-party services.
 *
 * Lucide doesn't ship official brand marks (Instagram, WhatsApp, Gmail).
 * react-icons/si is the Simple Icons set -- the de-facto open-source
 * source for brand glyphs. We re-export the three we use so consumers
 * import from one place; if we ever swap library, this is the only file
 * that changes.
 *
 * Lucide stays the default for non-brand icons (ArrowRight, Menu, etc.).
 */
import { SiGmail, SiInstagram, SiWhatsapp } from "react-icons/si";

export const InstagramIcon = SiInstagram;
export const WhatsAppIcon = SiWhatsapp;
export const GmailIcon = SiGmail;
