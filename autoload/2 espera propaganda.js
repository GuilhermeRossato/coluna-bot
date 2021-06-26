console.log("Esperando propaganda...");
await sleep(2000);
let teve_propaganda = false;
while (true) {
	const exists = await page.evaluate(() => {
		const query = `span[data-a-target="video-ad-label"]`;
		return !!document.querySelector(query);
	});
	if (!exists) {
		break;
	}
	teve_propaganda = true;
	await sleep(1000);
}
if (teve_propaganda) {
	console.log("Esperei pela propaganda");
} else {
	console.log("Nem teve propaganda");
}
await sleep(1000);