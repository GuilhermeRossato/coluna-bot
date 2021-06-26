const PNG = require('pngjs').PNG;
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node-gpu");

/**
 * @param {"treated 0 0 0.8331.png"|string} file
 */
function decodeTreatedDatasetFilename(file) {
	if (!file.startsWith("treated ") || !file.endsWith(".png")) {
		return false;
	}
	const [idString, counterString, valueString] = file.replace("treated ", "").substring(1).split(" ");
	const result = {
		file,
		id: parseInt(idString, 10),
		counter: parseInt(counterString, 10),
		value: parseFloat(valueString)
	}
	if (isNaN(result.id) || isNaN(result.counter) || isNaN(result.value)) {
		return false;
	}

	return result;
}

/**
 * @param {string} filePath
 * @returns {Promise<Tensor<Rank>>}
 */
async function generateTensorFromImage(filePath) {
	let floatArray;
	const [width, height] = await new Promise(resolve =>
		fs.createReadStream(filePath).pipe(new PNG()).on('parsed', function() {
			floatArray = new Float32Array(this.width * this.height * 3);
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					const i = (this.width * y + x) * 4;
					const j = (this.width * y + x) * 3;
					floatArray[j + 0] = this.data[i + 0] / 255;
					floatArray[j + 1] = this.data[i + 1] / 255;
					floatArray[j + 2] = this.data[i + 2] / 255;
					// Make it so that there is a noise in about 1% of pixels so that it generalizes a bit
					if (Math.random() > 0.99) {
						floatArray[j + 0] = (floatArray[j + 0] + Math.random())/2;
						floatArray[j + 1] = (floatArray[j + 1] + Math.random())/2;
						floatArray[j + 2] = (floatArray[j + 2] + Math.random())/2;
					}
				}
			}
			resolve([this.width, this.height]);
		})
	);
	return tf.tensor([floatArray], [1, floatArray.length], "float32");
}

(async function init() {

	const model = await tf.loadLayersModel("file://model-after/model.json");

	const dataset = await Promise.all(
		fs.readdirSync("../dataset/").map(
			file => decodeTreatedDatasetFilename(file)
		).filter(
			obj => obj
		).map(async ({file, value}) => {
			const filePath = `../dataset/${file}`;
			try {
				return {
					input: await generateTensorFromImage(filePath),
					output: tf.tensor([[value]], [1, 1], "float32")
				}
			} catch (err) {
				console.log("File", filePath, "caused", err.stack);
				return null;
			}
		})
	);

	let err_sum = 0;
	for (let i = 0; i < dataset.length; i++) {
		const tensor = model.predict(dataset[i].input);
		const predicted = tensor.dataSync()[0];
		const expected = dataset[i].output.dataSync()[0];
		const error = expected - predicted;

		err_sum += Math.abs(error);

		console.log(i, error.toFixed(5), predicted, expected);
	}

	console.log("Average error: " + err_sum / 1000);

})().catch(console.log);