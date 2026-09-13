/**
 * Remove abandoned upload staging objects using the existing R2 credentials.
 * Defaults to a dry run. Never reads or deletes published image namespaces.
 *
 * Preview: pnpm r2:cleanup
 * Apply:   pnpm r2:cleanup --apply
 *
 * The `r2:cleanup` script loads `.env.local` when it exists, so a local dry run
 * works without exporting anything. The scheduled job has no such file and
 * supplies the R2 variables through the process environment instead; nothing
 * here requires a credential file to be present.
 */
import {
	cleanupAbandonedStaging,
	parseStagingCleanupMode,
	StagingCleanupError,
	type StagingCleanupReport,
} from "../lib/storage/cleanup-staging";

const USAGE = "Usage: pnpm exec tsx scripts/cleanup-staging.ts [--dry-run | --apply | --help]";

function counts(report: StagingCleanupReport): string {
	return [
		`mode=${report.mode}`,
		`pages=${report.pages}`,
		`listed=${report.listed}`,
		`eligible=${report.eligible}`,
		`retained=${report.retained}`,
		`attempted=${report.attempted}`,
		`confirmed_deleted=${report.deleted}`,
	].join(" ");
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	if (args.length === 1 && args[0] === "--help") {
		console.log(USAGE);
		return;
	}
	let mode: ReturnType<typeof parseStagingCleanupMode>;
	try {
		mode = parseStagingCleanupMode(args);
	} catch {
		console.error(USAGE);
		process.exitCode = 1;
		return;
	}
	try {
		console.log(counts(await cleanupAbandonedStaging(mode)));
	} catch (error) {
		if (error instanceof StagingCleanupError) {
			console.error(error.message);
			console.error(counts(error.report));
		} else {
			console.error("Staging cleanup failed. No further deletions were attempted.");
		}
		// Provider errors can contain request details; never print their cause,
		// object keys, continuation tokens or credentials in a scheduled log.
		process.exitCode = 1;
	}
}

void main();
