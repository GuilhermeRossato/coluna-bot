const PNG = require('pngjs').PNG;
const fs = require("fs");
const b = (i, j, k) => i + (j - i) * k;
const ib = (i, j, k) => (k - i) / (j - i);

await Promise.all(fs.readdirSync("./data").filter(file => file.startsWith("full ") && file.endsWith(".png")).map(
	async file => {
		const id = parseInt(file.replace("full ", "").replace(".png", ""), 10);
		const targetFilename = "raw " + id + ".png";
		const img = await extractCameraFromRawVideo("./data/"+file);
		await new Promise(resolve => img.pack().pipe(fs.createWriteStream("./data/" + targetFilename)).on("finish", resolve));
	}
));

console.log("Parte da camera pegada com sucesso");

async function extractCameraFromRawVideo(filePath) {
	return await new Promise(resolve => {
		fs.createReadStream(
			filePath
		).pipe(
			new PNG()
		).on("parsed", function() {
			const img = new PNG({
				width: 284,
				height: 271,
				filterType: -1
			});

			const start_x = b(599, 469, ib(890, 700, this.width));
			const start_y = b(14, 9, ib(501, 394, this.height));
			const end_x = b(884, 695, ib(890, 700, this.width));
			const end_y = b(285, 225, ib(501, 394, this.height));

			for (let y = 0; y < img.height; y++) {
				for (let x = 0; x < img.width; x++) {
					const sx = Math.round(b(start_x, end_x, ib(0, img.width, x)));
					const sy = Math.round(b(start_y, end_y, ib(0, img.height, y)));

					const ids = (sy * this.width + sx) * 4;
					const idt = (y * img.width + x) * 4;
					img.data[idt + 0] = this.data[ids + 0];
					img.data[idt + 1] = this.data[ids + 1];
					img.data[idt + 2] = this.data[ids + 2];
					img.data[idt + 3] = 255;
				}
			}
			resolve(img);
		})
	});
}