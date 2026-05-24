/**
 * Tailwind 4 ships its own PostCSS plugin (`@tailwindcss/postcss`). No autoprefixer
 * needed; Tailwind handles vendor prefixes internally.
 */
export default {
	plugins: {
		"@tailwindcss/postcss": {},
	},
};
