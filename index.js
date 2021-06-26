const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

async function startBrowser() {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		args: [
			"--disable-features=site-per-process",
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--auto-open-devtools-for-tabs",
			"--user-data-dir=C:\\Users\\gui_r\\AppData\\Local\\Google\\Chrome\\User Data",
			"--annotation=plat=Win64",
			"--annotation=prod=Chrome",
			"--database=C:\\Users\\gui_r\\AppData\\Local\\Google\\Chrome\\User Data\\Crashpad",
			"--metrics-dir=C:\\Users\\gui_r\\AppData\\Local\\Google\\Chrome\\User Data"
		]
	});
	const pages = await browser.pages();
	const page = pages[0];

	await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36");

	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(window.navigator, 'webdriver', {
			get: () => undefined,
		});
		// @ts-ignore
		window.chrome = undefined;
		// @ts-ignore
		Object.defineProperty(window.history, 'length', {
			// @ts-ignore
			get: () => (window._last_history_value = (window._last_history_value || (Math.random() * 46 + 16 | 0)) + 1)
		});
	});

	await page.setExtraHTTPHeaders({
		'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,und;q=0.6',
		'Accept-Encoding': 'gzip, deflate, br',
	});

	await sleep(1000);

	await page.setViewport({
		width: 1280,
		height: 720
	});

	return {browser, page};
}

const sleep = (function(ms = 100) {return new Promise(r => setTimeout(r, ms));});

(async function init () {
	const {browser, page} = await startBrowser();
	global._my_browser = browser;
	global._my_page = page;
	global._sleep = sleep;

	let files = (await fs.readdir("autoload")).filter(
		fileName => fileName[0] >= '0' && fileName[0] <= '9' && fileName.endsWith(".js")
	).sort(
		(a, b) => {
			const aid = parseInt(a.split(" ")[0], 10);
			const bid = parseInt(b.split(" ")[0], 10);
			if (aid === bid) {
				return a > b ? 1 : -1;
			}
			return aid > bid ? 1 : -1;
		}
	);

	console.log(files);

	let state = "init";
	let lastUpdate = null;
	let id = 0;
	while (true) {
		if (state === "init") {
			if (files[id]) {
				const file = files[id];
				const fileString = await fs.readFile(`./autoload/${file}`, "utf8");
				if (fileString.startsWith("// disabled") || fileString.startsWith("//disabled") || fileString.startsWith("// skip") || fileString.startsWith("//skip")) {
					console.log("Skipped: \"" + file + "\"");
					id++;
					continue;
				}
				console.log("Running: \"" + file + "\"");
				let code;
				try {
					const codeStart = "\n(async function(browser, page, sleep) {";
					const codeEnd = "})(global._my_browser, global._my_page, global._sleep).catch(console.log)";
					code = codeStart + fileString + codeEnd;
					const r = await eval(code);
					if (r instanceof Error) {
						throw r;
					}
					id++;
				} catch (err) {
					console.log("Eval Error:");
					console.error(err);
					state = "waiting";
				}
			} else {
				state = "waiting";
			}
			await sleep(500);
		} else if (state === "waiting") {
			const fileDates = await Promise.all((await fs.readdir("autoload")).filter(
				fileName => fileName[0] >= '0' && fileName[0] <= '9' && fileName.endsWith(".js")
			).map(
				async fileName => ({
					fileName,
					fileDate: (await fs.stat(`./autoload/${fileName}`)).mtime
				})
			));
			let maxFile = null;
			for (let entry of fileDates) {
				if (!maxFile || maxFile.fileDate < entry.fileDate) {
					maxFile = entry;
				}
			}
			if (lastUpdate == null) {
				console.log(`Ultimo arquivo atualizado: ${maxFile.fileName}`);
				lastUpdate = new Date(maxFile.fileDate.getTime());
			} else if (maxFile.fileDate.getTime() > lastUpdate.getTime()) {
				console.log(`Arquivo atualizado: ${maxFile.fileName}`);
				lastUpdate.setTime(maxFile.fileDate.getTime());
				const file = maxFile.fileName;
				const fileString = await fs.readFile(`./autoload/${file}`, "utf8");
				let code;
				try {
					const codeStart = "\n(async function(browser, page, sleep) {";
					const codeEnd = "})(global._my_browser, global._my_page, global._sleep).catch(console.log)";
					code = codeStart + fileString + codeEnd;
					await eval(code);
					id++;
				} catch (err) {
					console.log("Eval Error:");
					console.error(err);
				}
			} else {
				// do nothing
			}
			await sleep(500);
		} else {
			break;
		}
	}
})().catch(console.log);
