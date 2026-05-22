type Props = {
	className?: string;
	style?: React.CSSProperties;
};

export default function OrbitRing({ className = "", style }: Props) {
	return (
		<div
			className={`orbit-ring ${className}`}
			style={style}
			aria-hidden="true"
		/>
	);
}
