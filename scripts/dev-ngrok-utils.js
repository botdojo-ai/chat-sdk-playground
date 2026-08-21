const { spawn } = require("child_process");

const INVALID_NGROK_URL_MESSAGE =
	"The ngrok API did not return a valid HTTPS origin";

function validateNgrokPublicUrl(value) {
	if (typeof value !== "string" || value.trim() !== value) {
		throw new Error(INVALID_NGROK_URL_MESSAGE);
	}

	let parsed;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(INVALID_NGROK_URL_MESSAGE);
	}

	if (
		parsed.protocol !== "https:" ||
		!parsed.hostname ||
		parsed.username ||
		parsed.password ||
		parsed.pathname !== "/" ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(INVALID_NGROK_URL_MESSAGE);
	}

	return parsed.href;
}

function getBrowserCommand(value, platform = process.platform) {
	const url = validateNgrokPublicUrl(value);

	if (platform === "darwin") {
		return { command: "open", args: [url] };
	}

	if (platform === "win32") {
		return {
			command: "rundll32.exe",
			args: ["url.dll,FileProtocolHandler", url],
		};
	}

	return { command: "xdg-open", args: [url] };
}

function openBrowser(
	value,
	{ platform = process.platform, spawnImpl = spawn, logger = console } = {},
) {
	const { command, args } = getBrowserCommand(value, platform);
	const child = spawnImpl(command, args, {
		stdio: "ignore",
		shell: false,
		windowsHide: true,
	});
	let reported = false;

	const reportFailure = () => {
		if (reported) return;
		reported = true;
		logger.log(
			`\n⚠️  Could not open browser automatically. Please visit: ${args.at(-1)}`,
		);
	};

	child.once("error", reportFailure);
	child.once("close", (code) => {
		if (reported) return;
		if (code === 0) {
			reported = true;
			logger.log(`\n🌐 Opening browser at ${args.at(-1)}`);
		} else {
			reportFailure();
		}
	});

	return child;
}

function getDevServerCommand(
	platform = process.platform,
	{
		nodePath = process.execPath,
		packageManagerScript = process.env.npm_execpath,
		commandInterpreter = process.env.ComSpec,
	} = {},
) {
	if (packageManagerScript) {
		return {
			command: nodePath,
			args: [packageManagerScript, "run", "dev"],
		};
	}

	if (platform === "win32") {
		return {
			command: commandInterpreter || "cmd.exe",
			args: ["/d", "/s", "/c", "pnpm dev"],
		};
	}

	return { command: "pnpm", args: ["dev"] };
}

module.exports = {
	getBrowserCommand,
	getDevServerCommand,
	openBrowser,
	validateNgrokPublicUrl,
};
