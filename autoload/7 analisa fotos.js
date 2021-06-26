const PNG = require('pngjs').PNG;
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node-gpu");

await sleep(1000);

if (!global.model) {
	global.model = await tf.loadLayersModel("file://./model/model-after/model.json");
}
const model = global.model;

fs.readdirSync("./data/").filter(name => name.startsWith("tested ")).forEach(file => { try { fs.unlinkSync("./data/"+file); } catch (err) {} });

const files = fs.readdirSync("./data/").filter(name => name.startsWith("treated "));

if (files.length === 0) {
	console.log("Não há fotos não analizadas");
}

for (let file of files) {

	const [id, variation] = file.replace("treated ", "").replace(".png", "").split(" ").map(value => parseInt(value, 10));
	if (isNaN(id) || isNaN(variation)) {
		throw new Error("Erro ao interpretar o arquivo de nome \"" + file + "\" na preparação das fotos");
	}
	const filePath = `./data/${file}`;
	const tensor = await generateTensorFromImage(filePath);
	const predicted = model.predict(tensor).dataSync()[0];
	console.log(`A foto [${ id }], variação [${variation }] em ${filePath} tem postura ruim com ${(predicted*100).toFixed(1)}% de confiança`);
	if (!fs.existsSync(filePath)) {
		console.log("File no longer exists!");
	} else {
		fs.renameSync(filePath, `./data/tested ${id} ${variation} ${predicted.toFixed(4)}.png`);
	}
}

async function generateTensorFromImage(filePath) {
	if (!fs.existsSync(filePath)) {
		return console.log("Should not happen");
	}
	let floatArray = null;
	const error = await new Promise(resolve =>
		fs.createReadStream(filePath).pipe(new PNG()).on("error", (err) => resolve(err)).on("parsed", function() {
			floatArray = new Float32Array(this.width * this.height * 3);
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					const i = (this.width * y + x) * 4;
					const j = (this.width * y + x) * 3;
					floatArray[j + 0] = this.data[i + 0] / 255;
					floatArray[j + 1] = this.data[i + 1] / 255;
					floatArray[j + 2] = this.data[i + 2] / 255;
				}
			}
			resolve();
		})
	);
	if (error) {
		console.log(error);
		return null;
	}
	if (floatArray === null) {
		console.log("Could not generate");
		return null;
	}
	return tf.tensor([floatArray], [1, floatArray.length], "float32");
}
