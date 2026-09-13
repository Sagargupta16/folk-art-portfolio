import { ImageResponse } from "next/og";
import { getSite } from "@/lib/data";
import { SERVER_BRAND_COLORS } from "@/lib/server-brand-colors";

export const alt = "Kalchar by Megha, traditional folk art";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
	const site = getSite();
	const logo = await readFile(join(process.cwd(), "public/logo.jpg"));
	const logoUrl = `data:image/jpeg;base64,${logo.toString("base64")}`;

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "72px 82px",
				background: SERVER_BRAND_COLORS.paper,
				color: SERVER_BRAND_COLORS.ink,
				borderTop: `14px solid ${SERVER_BRAND_COLORS.terracotta}`,
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
				<div
					style={{
						fontSize: 22,
						letterSpacing: 5,
						textTransform: "uppercase",
						color: SERVER_BRAND_COLORS.terracotta,
					}}
				>
					Traditional folk art
				</div>
				<div style={{ display: "flex", marginTop: 26, fontSize: 78, lineHeight: 1.05 }}>
					{site.brand.publicName}
				</div>
				<div
					style={{ display: "flex", marginTop: 28, fontSize: 30, color: SERVER_BRAND_COLORS.ink }}
				>
					Original artwork, workshops, and custom pieces rooted in Indian traditions.
				</div>
				<div
					style={{
						display: "flex",
						marginTop: 40,
						fontSize: 22,
						color: SERVER_BRAND_COLORS.terracotta,
					}}
				>
					kalchar.co.in
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 300,
					height: 300,
					border: `6px solid ${SERVER_BRAND_COLORS.marigold}`,
					borderRadius: 24,
					transform: "rotate(3deg)",
					overflow: "hidden",
				}}
			>
				{/* biome-ignore lint/performance/noImgElement: ImageResponse requires a native image. */}
				<img src={logoUrl} alt="" width={300} height={300} style={{ objectFit: "cover" }} />
			</div>
		</div>,
		size,
	);
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
