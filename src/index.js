import puppeteer from "puppeteer-extra";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://app.joinhandshake.com/login");
  await browser.close();
})();
