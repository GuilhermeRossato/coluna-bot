const list = await page.evaluate(function() {
	return [...document.querySelectorAll(`.rewards-list > .reward-list-item`)].map(a => ({
		nome: a.children[0].children[1].innerText,
		valor: parseInt(a.children[0].children[0].innerText.replace(".", ""), 10)
	}));
});

console.log(list);