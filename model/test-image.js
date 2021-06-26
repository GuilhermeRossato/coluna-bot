const PNG = require('pngjs').PNG;
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node-gpu");

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
				}
			}
			resolve([this.width, this.height]);
		})
	);
	return tf.tensor([floatArray], [1, floatArray.length], "float32");
}

(async function init() {

	const model = await tf.loadLayersModel("file://model-after/model.json");

	const image = await generateTensorFromImage(filePath);

	const tensor = model.predict(image);
	const predicted = tensor.dataSync()[0];

	console.log("" + (predicted*100).toFixed(1) + "% de certeza de postura ruim");
})().catch(console.log);