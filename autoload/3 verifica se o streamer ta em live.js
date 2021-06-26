console.log("Verificando se o streamer está online...");
const fs = require("fs");

if (await page.evaluate(function() {
	return !!document.querySelector(".channel-status-info.channel-status-info--offline");
})) {
	console.log("O streamer está offline, saindo...");
	let state;
	if (fs.existsSync("state.json")) {
		state = JSON.parse(fs.readFileSync("state.json", "utf8"));
	} else {
		state = [];
	}
	state.push({
		date: (new Date()).toISOString(),
		state: "offline"
	});
	fs.writeFileSync("state.json", JSON.stringify(state), "utf8");
	await browser.close();
	process.exit(0);
} else {
	console.log("O pai tá on");
}

await sleep(1000);