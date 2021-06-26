const url = "https://www.twitch.tv/jp_amis";
// const url = "https://www.twitch.tv/videos/1066750901";
console.log("Entrando em: " + url);
await page.goto(url);
await sleep(8000);
