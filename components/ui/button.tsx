/**
 * Minimal Button -- shadcn-style API. Uses class-variance-authority for the
 * variant matrix so consumers write `<Button variant="ghost" size="sm">`
 * instead of remembering the class string.
 *
 * For button-styled links (next/link or anchor), apply `buttonVariants(...)`
 * directly to the `<Link>` / `<a>` rather than wrapping a `<Button>` inside
 * one. Wrapping creates a nested interactive (`<a><button>`) which is an
 * a11y anti-pattern -- two tab stops, ambiguous screen-reader role.
 */
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,box-shadow,transform] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-[var(--color-accent)] text-[var(--color-bg)] hover:-translate-y-px hover:shadow-md",
				ghost:
					"bg-transparent text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
				link: "bg-transparent text-[var(--color-accent)] underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-9 px-3 text-xs uppercase tracking-[0.18em]",
				md: "h-11 px-5 text-sm uppercase tracking-[0.16em]",
				lg: "h-12 px-7 text-sm uppercase tracking-[0.18em]",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => (
		<button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
	),
);
Button.displayName = "Button";

export type { ButtonProps };
export { Button, buttonVariants };
