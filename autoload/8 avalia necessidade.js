const fs = require("fs");

const files = fs.readdirSync("./data/").filter(
	name => name.startsWith("tested") && name.endsWith(".png")
);

const veredicts = [];

for (const file of files) {
	let [image, variation, prediction_value] = file.replace("tested", "").substring(1).replace(".png", "").split(" ").map(value => parseFloat(value));
	veredicts.push({
		image,
		variation,
		prediction_value
	});
}

const average = (veredicts.map(veredict => veredict.prediction_value).reduce((prev, cur) => prev+cur, 0) / veredicts.length);

if (average < 0.5) {
	let state;
	if (fs.existsSync("state.json")) {
		state = JSON.parse(fs.readFileSync("state.json", "utf8"));
	} else {
		state = [];
	}
	console.log("Taxa baixa de confiança: " + (average * 100).toFixed(1) + "%. Fechando.");
	state.push({
		date: (new Date()).toISOString(),
		state: "boa-postura",
		value: average
	});
	fs.writeFileSync("state.json", JSON.stringify(state), "utf8");
	await browser.close();
	process.exit(0);
}

global.trustFactor = average;