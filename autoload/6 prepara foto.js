const PNG = require('pngjs').PNG;
const fs = require("fs");
const b = (i, j, k) => i + (j - i) * k;
const ib = (i, j, k) => (k - i) / (j - i);

console.log("Preparando as fotos para rede neural");

const files = fs.readdirSync("./data/").filter(name => name.startsWith("raw "));

let problemasFrame = 0;

for (let file of files) {
	const id = parseInt(file.replace("raw ", "").replace(".png", ""), 10);
	if (isNaN(id)) {
		throw new Error("Erro ao interpretar o arquivo de nome " + file + " na hora da preparação das fotos");
	}

	console.log(`Tratando foto [${ id }] de ${files.length} do streamer`);

	const filePath = `./data/${file}`;

	const result = await transformRawImageIntoMultipleImages(filePath);
	if (typeof result === "string") {
		if (result === "Arquivo tem problema de frame") {
			problemasFrame++;
			continue;
		} else {
			throw new Error(result);
		}
	}
	if (!(result instanceof Array)) {
		console.log("Result is not an array:", result);
		throw new Error("Result is not an array");
	}
	await Promise.all(result.map(
		(png, index) => new Promise(
			resolve => png.pack().pipe(fs.createWriteStream(`./data/treated ${id} ${index}.png`)).on("finish", resolve)
		)
	));
}

if (problemasFrame/(files.length-1) > 0.4) {
	throw new Error("Ocorreram mais de metade com erro de frame, não dá pra analizar");
}

/**
 * Resolves into an error message or a list of PNG images
 * @param {string} filePath
 * @returns {Promise<string | PNG[]>}
 */
async function transformRawImageIntoMultipleImages(filePath) {
	return await new Promise(
		resolve => fs.createReadStream(
			filePath
		).pipe(
			new PNG()
		).on(
			"error",
			(err) => resolve(err.stack || err.toString())
		).on(
			'parsed',
			function() {
				let is_black_square = true;
				let idx;
				if (is_black_square) {
					for (let x = 0; x < this.width; x++) {
						// verifica em cima
						idx = (this.width * (0) + x) << 2;
						{
							const r = this.data[idx+0];
							const g = this.data[idx+1];
							const b = this.data[idx+2];
							if (r > 10 || g > 10 || b > 10) {
								is_black_square = false;
								console.log("O arquivo \"" + filePath + "\" tem problema no pixel de cima:", x, 0, "e a cor é:", r, g, b);
								break;
							}
						}
						// verifica em baixo
						idx = (this.width * (this.height - 1) + x) << 2;
						{
							const r = this.data[idx+0];
							const g = this.data[idx+1];
							const b = this.data[idx+2];
							if (r > 10 || g > 10 || b > 10) {
								is_black_square = false;
								console.log("O arquivo \"" + filePath + "\" tem problema no pixel de baixo:", x, this.height-1, "e a cor é:", r, g, b);
								break;
							}
						}
					}
				}
				if (is_black_square) {
					for (let y = 0; y < this.height; y++) {
						// verifica a esquerda
						idx = (this.width * (y) + (0)) << 2;
						{
							const r = this.data[idx+0];
							const g = this.data[idx+1];
							const b = this.data[idx+2];
							if (r > 10 || g > 10 || b > 10) {
								is_black_square = false;
								console.log("O arquivo \"" + filePath + "\" tem problema no pixel da esquerda:", 0, y, "e a cor é:", r, g, b);
								break;
							}
						}
						// verifica a direita
						idx = (this.width * (y) + (this.width-1)) << 2;
						{
							const r = this.data[idx+0];
							const g = this.data[idx+1];
							const b = this.data[idx+2];
							if (r > 10 || g > 10 || b > 10) {
								is_black_square = false;
								console.log("O arquivo \"" + filePath + "\" tem problema no pixel da direita:", this.width-1, y, "e a cor é:", r, g, b);
								break;
							}
						}
					}
				}
				if (!is_black_square) {
					return resolve("Arquivo tem problema de frame");
				}
				const imageList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(_ =>
					new PNG({
						width: 51,
						height: 35,
						filterType: -1
					})
				);

				const start_x = 0.1216 * this.width;
				const start_y = 0.3333 * this.height;
				const end_x = 0.9414 * this.width;
				const end_y = 0.9202 * this.height;

				for (let y = 0; y < imageList[0].height; y++) {
					for (let x = 0; x < imageList[0].width; x++) {
						const ti = (y * imageList[0].width + x) << 2;

						const sx = Math.floor(b(start_x, end_x, ib(0, imageList[0].width, x)));
						const sy = Math.floor(b(start_y, end_y, ib(0, imageList[0].height, y)));

						if (sx < 0 || sx >= this.width || sy < 0 || sy >= this.height) {
							console.warn("sx ou sy fora do limite", sx, sy, "limite:", this.width, this.height);
							continue;
						}

						{
							const si_0 = (this.width * (sy+0) + (sx+0)) << 2;
							const si_1 = (this.width * (sy+0) + (sx+1)) << 2;
							const si_2 = (this.width * (sy+1) + (sx+0)) << 2;
							const si_3 = (this.width * (sy+1) + (sx+1)) << 2;
							const si_4 = (this.width * (sy+1) + (sx+1)) << 2;
							const si_5 = (this.width * (sy+1) + (sx+2)) << 2;
							const si_6 = (this.width * (sy+2) + (sx+1)) << 2;
							const si_7 = (this.width * (sy+2) + (sx+2)) << 2;

							imageList[0].data[ti+0] = this.data[si_0+0];
							imageList[0].data[ti+1] = this.data[si_0+1];
							imageList[0].data[ti+2] = this.data[si_0+2];
							imageList[0].data[ti+3] = 255;

							imageList[1].data[ti+0] = this.data[si_1+0];
							imageList[1].data[ti+1] = this.data[si_1+1];
							imageList[1].data[ti+2] = this.data[si_1+2];
							imageList[1].data[ti+3] = 255;

							imageList[2].data[ti+0] = this.data[si_2+0];
							imageList[2].data[ti+1] = this.data[si_2+1];
							imageList[2].data[ti+2] = this.data[si_2+2];
							imageList[2].data[ti+3] = 255;

							imageList[3].data[ti+0] = this.data[si_3+0];
							imageList[3].data[ti+1] = this.data[si_3+1];
							imageList[3].data[ti+2] = this.data[si_3+2];
							imageList[3].data[ti+3] = 255;

							imageList[4].data[ti+0] = this.data[si_4+0];
							imageList[4].data[ti+1] = this.data[si_4+1];
							imageList[4].data[ti+2] = this.data[si_4+2];
							imageList[4].data[ti+3] = 255;

							imageList[5].data[ti+0] = this.data[si_5+0];
							imageList[5].data[ti+1] = this.data[si_5+1];
							imageList[5].data[ti+2] = this.data[si_5+2];
							imageList[5].data[ti+3] = 255;

							imageList[6].data[ti+0] = this.data[si_6+0];
							imageList[6].data[ti+1] = this.data[si_6+1];
							imageList[6].data[ti+2] = this.data[si_6+2];
							imageList[6].data[ti+3] = 255;

							imageList[7].data[ti+0] = this.data[si_7+0];
							imageList[7].data[ti+1] = this.data[si_7+1];
							imageList[7].data[ti+2] = this.data[si_7+2];
							imageList[7].data[ti+3] = 255;

							imageList[8].data[ti+0] = (this.data[si_0+0] + this.data[si_1+0] + this.data[si_2+0] + this.data[si_3+0]) / 4;
							imageList[8].data[ti+1] = (this.data[si_0+1] + this.data[si_1+1] + this.data[si_2+1] + this.data[si_3+1]) / 4;;
							imageList[8].data[ti+2] = (this.data[si_0+2] + this.data[si_1+2] + this.data[si_2+2] + this.data[si_3+2]) / 4;;
							imageList[8].data[ti+3] = 255;

							imageList[9].data[ti+0] = (this.data[si_4+0] + this.data[si_5+0] + this.data[si_6+0] + this.data[si_7+0]) / 4;
							imageList[9].data[ti+1] = (this.data[si_4+1] + this.data[si_5+1] + this.data[si_6+1] + this.data[si_7+1]) / 4;;
							imageList[9].data[ti+2] = (this.data[si_4+2] + this.data[si_5+2] + this.data[si_6+2] + this.data[si_7+2]) / 4;;
							imageList[9].data[ti+3] = 255;
						}
					}
				}
				return resolve(imageList);
			}
		)
	);
}
