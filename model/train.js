const PNG = require('pngjs').PNG;
const tf = require("@tensorflow/tfjs-node-gpu");
const fs = require("fs");

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

function shuffle(array) {
	let currentIndex = array.length;
	let randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

(async function init() {
	const dataset = shuffle(await Promise.all(
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
	));

	const distributionFactor = 0.85;
	const firstSlice = dataset.slice(0, Math.floor(dataset.length * distributionFactor));
	const secondSlice = dataset.slice(Math.floor(dataset.length * distributionFactor));

	const xs = tf.concat(firstSlice.map(element => element.input));
	const ys = tf.concat(firstSlice.map(element => element.output));

	const valXs = tf.concat(secondSlice.map(element => element.input));
	const valYs = tf.concat(secondSlice.map(element => element.output));

	const model = tf.sequential({
		layers: [
			tf.layers.dense({inputShape: [5355], units: 32, activation: 'sigmoid'}),
			tf.layers.dense({units: 128, activation: 'sigmoid'}),
			tf.layers.dense({units: 1, activation: 'sigmoid'}),
		]
	});

	model.compile({
		loss: 'meanSquaredError',
		optimizer: 'adam',
		metrics: ['MAE', 'MSE']
	});

	console.log("Training...");

	await model.fit(xs, ys, {
		epochs: 160,
		validationData: [valXs, valYs],
		callbacks: {
			/**
			 * @param {number} epoch
			 * @param {{val_loss: number; val_MAE: number; val_MSE: number; loss: number; MAE: number; MSE: number}} info
			 */
			onEpochEnd: (epoch, info) => console.log(epoch, info.val_loss, info.val_MSE)
		}
	});

	model.save("file://model-after");

})().catch(console.log);

/*

(async function init() {
	const model = tf.sequential();
	model.add(tf.layers.dense({ units: 1, inputShape: [5355] }));
	model.compile({
		loss: 'meanSquaredError',
		optimizer: 'adam',
		metrics: ['MAE']
	});

	const xs = tf.randomUniform([100, 5355]);
	const ys = tf.randomUniform([100, 1]);
	const valXs = tf.randomUniform([10, 5355]);
	const valYs = tf.randomUniform([10, 1]);

	valXs.print();

	await model.fit(xs, ys, {
		epochs: 100,
		validationData: [valXs, valYs],
		callbacks: {
			//onYield: (...args) => console.log(args),
			onEpochEnd: (...args) => console.log(args)
		}
	});
})().catch(console.log);
*/
