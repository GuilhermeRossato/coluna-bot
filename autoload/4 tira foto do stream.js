
const imageCount = 16;
for (let i = 0; i < imageCount; i++) {
	console.log(`Tirando foto ${i+1} de ${imageCount} do streamer (${4 * (imageCount - i)}s restantes)`);
	const handle = await page.$("video");
	const width = await page.evaluate(function(handle) {
		if (!handle) {
			return null;
		}
		return handle.getBoundingClientRect().width;
	}, handle);

	if (!width) {
		console.log("Não deu pra achar o tamanho do video");
		continue;
	}

	handle.screenshot({
		path: `./data/full ${i}.png`,
		captureBeyondViewport: false
	});

	await sleep(4000);
}

await sleep(3000);