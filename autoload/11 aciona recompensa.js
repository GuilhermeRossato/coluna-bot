const nome = "POSTURA!";

const exists = await page.evaluate(function(nome) {
	const query = `.rewards-list > .reward-list-item p[title="${nome}"]`;
	return !!(document.querySelectorAll(query)[0]);
}, nome);

if (!exists) {
	throw new Error("O nome da recompensa não existe");
}
/** @type {import("puppeteer").JSHandle} */
const handle = await page.evaluateHandle(function(nome) {
	const query = `.rewards-list > .reward-list-item p[title="${nome}"]`;
	const p = document.querySelector(query);
	if (!p) {
		return null;
	}
	return p.parentNode.parentNode.querySelector("button");
}, nome);

if (!handle) {
	throw new Error("Nao achei o botao");
}

const element = handle.asElement();

if (!element) {
	throw new Error("Não consegui o elemento do jshandle")
}

await element.click();

await sleep(1000);