type IconProps = {
	size?: number;
	className?: string;
};

export function Instagram({ size = 20, className = "" }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function Whatsapp({ size = 20, className = "" }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="M3 21l1.65-4.5A8.5 8.5 0 1 1 7.5 19.65L3 21z" />
			<path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l.5-1.5-2-1-1 1c-1 0-2-1-2-2l1-1-1-2-1.5.5C8 9.4 8.5 9.5 9 9.5z" />
		</svg>
	);
}

export function Mail({ size = 20, className = "" }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3 7l9 6 9-6" />
		</svg>
	);
}
