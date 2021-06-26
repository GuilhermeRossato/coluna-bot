const fs = require("fs");

/**
 * @param {number} trustFactor
 * @param {Date[]} previousFixes
 */
function getMessages(trustFactor, previousFixes) {
	let lastFix = null;
	let diffString = '';
	if (previousFixes && previousFixes.length > 0) {
		lastFix = new Date();
		const currentTime = lastFix.getTime();
		const dateThen = new Date(previousFixes.pop());
		lastFix.setTime(dateThen.getTime());
		const diffMinutes = ((currentTime - lastFix.getTime()) / 1000) / 60;
		const sufix = `${(diffMinutes%60).toFixed(0)} minutos atrás`;
		if (diffMinutes >= 120) {
			diffString = `${Math.floor(diffMinutes/60)} horas e ${sufix}`;
		} else if (diffMinutes >= 60) {
			diffString = `1 hora e ${sufix}`;
		} else {
			diffString = sufix;
		}
	}
	return [
		[
			`[ColunaBot] Minha rede neural open source top de linha diz que o jp está com postura ruim`,
			`com ${(trustFactor*100).toFixed(1)}% de confiança.`,
		].join(" "),
		[
			lastFix && previousFixes.length > 0 ? `Eu ja contribuí para a postura do jp ${previousFixes.length} vezes antes.` : `Essa é a primeira vez que eu arrumei a postura do JP.`,
			lastFix && previousFixes.length > 0 ? `A ultima vez foi em ${lastFix.getUTCDate().toString().padStart(2, "0")}/${(lastFix.getUTCMonth()+1).toString().padStart(2, "0")} as ${(lastFix.getUTCHours()+1).toString().padStart(2, "0")}:${(lastFix.getUTCMinutes()+1).toString().padStart(2, "0")} (${diffString})` : "Se ajeite ou nos veremos novamente."
		].join(" ")
	];
}

let state;
if (fs.existsSync("state.json")) {
	state = JSON.parse(fs.readFileSync("state.json", "utf8"));
} else {
	state = [];
}

if (!global.trustFactor) {
	throw new Error("Missing trust factor");
}

const messages = getMessages(global.trustFactor, state.filter(unit => unit.state === "avisado").map(unit => unit.date));

state.push({
	date: (new Date()).toISOString(),
	state: "avisado",
	value: global.trustFactor
});

console.log(messages);

fs.writeFileSync("state.json", JSON.stringify(state, null, "\t"), "utf8");