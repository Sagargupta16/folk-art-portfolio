import Link from "next/link";

export default function NotFound() {
	return (
		<main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
			<p className="t-eyebrow">404</p>
			<h1 className="mt-3 font-display text-4xl italic">Page not found</h1>
			<p className="mt-3 text-muted">The page you were looking for has moved or never existed.</p>
			<Link
				href="/"
				className="mt-8 text-sm uppercase tracking-eyebrow text-accent underline-offset-4 hover:underline"
			>
				Back to home
			</Link>
		</main>
	);
}
