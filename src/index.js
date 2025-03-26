import "dotenv/config";
import puppeteer from "puppeteer"; // puppeteer-extra
//import StealthPlugin from "puppeteer-extra-plugin-stealth";

const username = process.env.HANDSHAKE_USERNAME;
const password = process.env.HANDSHAKE_PASSWORD;
const town = process.env.TOWN;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("[START] starting handshake automation...");

async function main() {
  const init = await initializeHandshake();

  if (!init) {
    return;
  }

  const browser = init.browser;
  const page = init.page;

  try {
    // initialize jobs currently being displayed
    await page.waitForSelector(`[data-hook="jobs-card"]`);
    const jobs = await page.$$(`[data-hook="jobs-card"]`);

    // search for new jobs every 10 minutes
    while (true) {
      await sleep(5 * 60 * 1000);
    }
  } catch (error) {
    console.log("[ERROR]");
    console.error(error);
  } finally {
    console.log("[FINISH] closing browser...");
    await browser.close();
  }
}

async function initializeHandshake() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox", // Disable sandbox for better performance
      "--disable-setuid-sandbox", // Disable sandbox for better performance
      "--disable-images", // Disable images
      "--disable-gpu", // Disable GPU hardware acceleration
      "--disable-software-rasterizer", // Disable software rendering
    ],
  });
  try {
    // open handshake
    console.log("[1] opening handshake website...");
    const page = await browser.newPage();

    await page.goto("https://lehigh.joinhandshake.com/login?ref=app-domain");
    console.log("[SUCCESS]");

    // login
    try {
      console.log("[2] logging in...");
      const ssoButton = await page.waitForSelector(".sso-button");
      await ssoButton.click();
      await page.waitForSelector("#username");
      await page.type("#username", username);
      await page.type("#password", password);

      await page.waitForSelector("#regularsubmit");
      await page.click("#regularsubmit");

      await page.waitForSelector("#trust-browser-button");
      await page.click("#trust-browser-button");
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }

    // Close modal
    try {
      console.log("[3] closing modal...");
      await page.waitForSelector(
        'button[data-hook="close-bootstrapping-follows-modal"]'
      );
      await page.click('button[data-hook="close-bootstrapping-follows-modal"]');
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }
    await sleep(1000);

    // Click Jobs link
    try {
      console.log("[4] navigating to jobs page...");
      const jobsChild = await page.waitForSelector("text/Jobs");
      const jobsParent = await jobsChild.evaluateHandle(
        (el) => el.parentElement
      );
      await jobsParent.click();
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }

    // Click Location button
    try {
      console.log("[5] clicking location filter...");
      await page.waitForSelector(".style__pill-content___QMdlA");
      const filterButtons = await page.$$(".style__pill-content___QMdlA");
      await filterButtons[0].click();
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }

    // Search for town
    try {
      console.log("[6] searching for town...");
      await page.waitForSelector("#locations-filter");
      await page.type("#locations-filter", town);
      await sleep(2000);
      const checkbox = await page.waitForSelector(`.sc-dTjBdT.iGTHzC`);
      await checkbox.click();
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }

    // click internship button
    try {
      console.log("[7] clicking location button...");
      await page.waitForSelector(".style__pill-content___QMdlA");
      const filterButtons = await page.$$(".style__pill-content___QMdlA");
      await filterButtons[2].click();
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      return;
    }
    console.log("[SUCCESS INITIALIZING]");
    return { browser, page };
  } catch (error) {
    console.log("[ERROR INITIALIZING]");
    console.error(error);
    return;
  }
}

main();
