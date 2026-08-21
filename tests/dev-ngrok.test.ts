const { EventEmitter } = require("events");
const http = require("http");

const {
	getBrowserCommand,
	getDevServerCommand,
	openBrowser,
	validateNgrokPublicUrl,
} = require("../scripts/dev-ngrok-utils");
const {
	getNgrokUrl,
	startDevServer,
	startNgrok,
} = require("../scripts/dev-ngrok");

function mockNgrokApiResponse(publicUrl: string) {
	jest.spyOn(http, "get").mockImplementation(((
		_url: string,
		callback: Function,
	) => {
		const response = new EventEmitter();
		const request = new EventEmitter();

		callback(response);
		process.nextTick(() => {
			response.emit(
				"data",
				JSON.stringify({
					tunnels: [{ proto: "https", public_url: publicUrl }],
				}),
			);
			response.emit("end");
		});

		return request;
	}) as any);
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("dev:ngrok URL handling", () => {
	test.each([
		"https://example.ngrok-free.app/; touch /tmp/owned",
		"https://example.ngrok-free.app/$(touch%20/tmp/owned)",
		"https://example.ngrok-free.app/?next=`id`",
	])("rejects shell-metacharacter payloads from the ngrok API", (value) => {
		expect(() => validateNgrokPublicUrl(value)).toThrow("valid HTTPS origin");
	});

	test.each([
		"http://example.ngrok-free.app",
		"file:///tmp/index.html",
		"javascript:alert(1)",
	])("rejects non-HTTPS schemes", (value) => {
		expect(() => validateNgrokPublicUrl(value)).toThrow("valid HTTPS origin");
	});

	test.each([
		"not a URL",
		"https://",
		"https://user:password@example.ngrok-free.app",
		"https://example.ngrok-free.app/path",
	])("rejects malformed or unexpected URL shapes", (value) => {
		expect(() => validateNgrokPublicUrl(value)).toThrow("valid HTTPS origin");
	});

	it("normalizes a valid custom HTTPS origin", () => {
		expect(validateNgrokPublicUrl("https://demo.example.com")).toBe(
			"https://demo.example.com/",
		);
	});

	it("rejects a hostile URL returned by the loopback ngrok API", async () => {
		mockNgrokApiResponse("https://demo.example.com/; touch /tmp/owned");

		await expect(getNgrokUrl(1)).rejects.toThrow("valid HTTPS origin");
	});
});

describe("dev:ngrok platform process selection", () => {
	test.each([
		["darwin", "open", ["https://demo.example.com/"]],
		[
			"win32",
			"rundll32.exe",
			["url.dll,FileProtocolHandler", "https://demo.example.com/"],
		],
		["linux", "xdg-open", ["https://demo.example.com/"]],
	])("opens the browser safely on %s", (platform, command, args) => {
		expect(getBrowserCommand("https://demo.example.com", platform)).toEqual({
			command,
			args,
		});
	});

	it("spawns the browser command with no shell", () => {
		const child = { once: jest.fn() };
		const spawnImpl = jest.fn(() => child);

		openBrowser("https://demo.example.com", {
			platform: "linux",
			spawnImpl,
		});

		expect(spawnImpl).toHaveBeenCalledWith(
			"xdg-open",
			["https://demo.example.com/"],
			expect.objectContaining({ shell: false }),
		);
	});

	it("reports the manual URL when the opener exits unsuccessfully", () => {
		const listeners: Record<string, Function> = {};
		const child = {
			once: jest.fn((event, callback) => {
				listeners[event] = callback;
				return child;
			}),
		};
		const spawnImpl = jest.fn(() => child);
		const logger = { log: jest.fn() };

		openBrowser("https://demo.example.com", {
			platform: "linux",
			spawnImpl,
			logger,
		});
		listeners.close(1);

		expect(logger.log).toHaveBeenCalledWith(
			expect.stringContaining(
				"Could not open browser automatically. Please visit: https://demo.example.com/",
			),
		);
	});

	it("runs the package manager entrypoint through Node when available", () => {
		expect(
			getDevServerCommand("win32", {
				nodePath: "C:\\Program Files\\nodejs\\node.exe",
				packageManagerScript: "C:\\pnpm\\pnpm.cjs",
			}),
		).toEqual({
			command: "C:\\Program Files\\nodejs\\node.exe",
			args: ["C:\\pnpm\\pnpm.cjs", "run", "dev"],
		});

		expect(
			getDevServerCommand("linux", {
				nodePath: "/usr/local/bin/node",
				packageManagerScript: "/usr/local/lib/node_modules/npm/bin/npm-cli.js",
			}),
		).toEqual({
			command: "/usr/local/bin/node",
			args: [
				"/usr/local/lib/node_modules/npm/bin/npm-cli.js",
				"run",
				"dev",
			],
		});
	});

	it("uses only a fixed command when direct Windows execution needs cmd.exe", () => {
		expect(
			getDevServerCommand("win32", {
				packageManagerScript: "",
				commandInterpreter: "C:\\Windows\\System32\\cmd.exe",
			}),
		).toEqual({
			command: "C:\\Windows\\System32\\cmd.exe",
			args: ["/d", "/s", "/c", "pnpm dev"],
		});
		expect(getDevServerCommand("darwin", { packageManagerScript: "" })).toEqual(
			{
				command: "pnpm",
				args: ["dev"],
			},
		);
	});

	it("starts the dev server with the selected command and no shell", () => {
		const spawnImpl = jest.fn(() => ({}));

		startDevServer({
			spawnImpl,
			platform: "darwin",
			nodePath: "/usr/local/bin/node",
			packageManagerScript: "/usr/local/lib/pnpm.cjs",
			cwd: "/workspace/playground",
		});

		expect(spawnImpl).toHaveBeenCalledWith(
			"/usr/local/bin/node",
			["/usr/local/lib/pnpm.cjs", "run", "dev"],
			{
				stdio: "inherit",
				shell: false,
				cwd: "/workspace/playground",
			},
		);
	});

	it("starts ngrok with fixed arguments and no shell", () => {
		const spawnImpl = jest.fn(() => ({}));

		startNgrok({ spawnImpl, port: 3500 });

		expect(spawnImpl).toHaveBeenCalledWith("ngrok", ["http", "3500"], {
			stdio: "pipe",
			shell: false,
		});
	});
});
