/** Keep awaits inside a function so tsx can import these scripts as CommonJS.
 * @param {() => Promise<void>} main
 * @param {string} failureMessage
 */
export async function runCli(main, failureMessage) {
	try {
		await main();
	} catch (error) {
		console.error(error instanceof Error ? error.message : failureMessage);
		process.exitCode = 1;
	}
}
