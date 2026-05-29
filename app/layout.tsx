import type { Metadata, Viewport } from "next";
import { PaperGrain } from "@/components/decor/paper-grain";
import { ScrollProgress } from "@/components/decor/scroll-progress";
import { ArtworkLightbox } from "@/components/gallery/artwork-lightbox";
import { LightboxProvider } from "@/components/gallery/lightbox-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getSite } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import { extractPhoneFromWaUrl } from "@/lib/whatsapp";
import { fontBody, fontDevanagari, fontDisplay } from "./fonts";
import "./globals.css";

const site = getSite();
const whatsappPhone = extractPhoneFromWaUrl(site.contact.whatsapp.url);

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: site.brand.title,
		template: `%s · ${site.brand.publicName}`,
	},
	description: site.brand.description,
	openGraph: {
		title: site.brand.title,
		description: site.brand.description,
		url: siteConfig.prodUrl,
		siteName: site.brand.publicName,
		locale: "en_IN",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: site.brand.title,
		description: site.brand.description,
	},
	icons: {
		icon: "/logo.jpg",
		apple: "/logo-180.png",
	},
};

export const viewport: Viewport = {
	colorScheme: "light dark",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#faf8f3" },
		{ media: "(prefers-color-scheme: dark)", color: "#15110d" },
	],
};

/**
 * Root layout. The pre-paint script below resolves the user's theme preference
 * and adds `class="dark"` to <html> before first paint, so dark-mode users
 * never see a flash of light styles.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
	const fontVars = `${fontBody.variable} ${fontDisplay.variable} ${fontDevanagari.variable}`;
	return (
		<html lang="en" suppressHydrationWarning className={fontVars}>
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint script must be inline
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var v=t||(d?'dark':'light');if(v==='dark')document.documentElement.classList.add('dark');}catch(_){}})();`,
					}}
				/>
				{/* No-JS fallback: Motion's <Reveal> ships SSR markup with inline
				    `opacity:0`. Without JS the fade-up never runs, leaving content
				    invisible. This rule wins via the `<noscript>` cascade and snaps
				    content back to visible for crawlers / no-JS visitors. */}
				<noscript>
					<style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important;}`}</style>
				</noscript>
			</head>
			<body className="font-sans">
				<a
					href="#main"
					className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-bg"
				>
					Skip to content
				</a>
				<PaperGrain />
				<MotionProvider>
					<LightboxProvider whatsappPhone={whatsappPhone}>
						<SmoothScroll />
						<ScrollProgress />
						<SiteHeader />
						<div id="main" className="relative z-10">
							{children}
						</div>
						<SiteFooter />
						<ArtworkLightbox />
					</LightboxProvider>
				</MotionProvider>
			</body>
		</html>
	);
}
