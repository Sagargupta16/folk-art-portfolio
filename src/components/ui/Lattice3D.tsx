function CubeFaces() {
	return (
		<>
			<div className="lattice-3d__face" />
			<div className="lattice-3d__face" />
			<div className="lattice-3d__face" />
			<div className="lattice-3d__face" />
			<div className="lattice-3d__face" />
			<div className="lattice-3d__face" />
		</>
	);
}

export default function Lattice3D() {
	return (
		<div className="lattice-3d" aria-hidden="true">
			<div className="lattice-3d__cube">
				<CubeFaces />
			</div>
			<div className="lattice-3d__cube lattice-3d__cube--sm" style={{ top: "30%", left: "20%" }}>
				<CubeFaces />
			</div>
			<div className="lattice-3d__cube lattice-3d__cube--lg" style={{ top: "60%", left: "70%" }}>
				<CubeFaces />
			</div>
		</div>
	);
}
