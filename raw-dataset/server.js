const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express()

app.use(express.static(path.resolve(".")))

let imgId = fs.readdirSync(".").filter(
	file => file.startsWith("labeled") && file.endsWith(".png")
).map(
	file => {
		const name = file.replace("labeled", "").substring(1);
		if (name.includes(" ")) {
			return name.split(" ");
		} else if (name.includes("-")) {
			return name.split("-");
		}
		console.log("Could not interpret name:", name);
		return null;
	}
).filter(
	pair => pair && pair.length === 2 && !isNaN(parseInt(pair[0]))
).map(
	([id, factor]) => ({
		id: parseInt(id, 10),
		factor: parseFloat(factor)
	})
).reduce(
	(largestId, pair) => (largestId > pair.id) ? largestId : pair.id,
	0
);

app.get("/exit/", function() {
	process.exit(0);
})

app.get('/', function (req, res) {
	if (!req.query || !req.query.file) {
		const files = fs.readdirSync(".").filter(a => !a.startsWith("labeled") && a.endsWith(".png"));
		res.send(`
		<div id="imgName" style="width:222px;text-align: center;">${files[0]}</div>
		<img src="${files[0]}" />
		<p>How terrible is this posture?</p>
		<div class="button-list"></div>
		<script>
		let id = 0;
		const files = ${JSON.stringify(files)};
		const wrapper = document.querySelector(".button-list");
		const img = document.querySelector("img");
		function putNextImage() {
			id++;
			if (files[id]) {
				imgName.innerText = files[id];
				img.src = files[id];
			} else {
				document.body.innerHTML = "End of program";
				fetch("/exit/");
			}
		}
		for (let i = 0; i < 7; i++) {
			const btn = document.createElement("button");
			btn.innerText = (100*i/6).toFixed(0).toString() + "%";
			btn.setAttribute("data-rate", (i/6).toFixed(6));
			btn.style.width = "50px";
			wrapper.appendChild(btn);
			btn.onclick = async function() {
				const response = await fetch("/?file=" + img.src.replace("http://localhost:3001/", "") + "&rate=" + btn.getAttribute("data-rate"));
				const text = await response.text();
				if (text) {
					console.log(text);
				} else {
					console.log("Success");
					putNextImage();
				}
			}
		}
		</script>
		`);
		return;
	}
	if (req.query.file && req.query.rate) {
		try {
			const rateFactor = parseFloat(req.query.rate);
			if (isNaN(rateFactor) || rateFactor < 0 || rateFactor > 1) {
				throw new Error("Rate outside limit: " + rateFactor);
			}

			const existingIds = fs.readdirSync(".").filter(
				file => file.startsWith("labeled") && file.endsWith(".png")
			).map(
				file => {
					const name = file.replace("labeled", "").substring(1);
					if (name.includes(" ")) {
						return name.split(" ");
					} else if (name.includes("-")) {
						return name.split("-");
					}
					console.log("Could not interpret name:", name);
					return null;
				}
			).filter(
				pair => pair && pair.length === 2 && !isNaN(parseInt(pair[0]))
			).map(
				([id, factor]) => parseInt(id, 10)
			);
			while (existingIds.includes(imgId)) {
				imgId++;
			}
			const newName = `labeled ${imgId} ${rateFactor.toFixed(4)}.png`;
			console.log("User rated", req.query.rate, "the file \"" + req.query.file + "\", saved to \"" + newName + "\"");
			fs.renameSync(req.query.file, newName);
			imgId++;
			res.end();
		} catch (err) {
			res.send("Erro no servidor: " + err.stack);
		}
		return;
	}

	res.send("?");
})

app.listen(3001, function() {
	console.log("Label Server Up: ");
	console.log("\thttp://localhost:3001/");
});