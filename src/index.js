import "dotenv/config";
import puppeteer from "puppeteer";
import sendEmail from "./sendEmail.js";

const USERNAME = process.env.HANDSHAKE_USERNAME;
const PASSWORD = process.env.HANDSHAKE_PASSWORD;
const JOB_PAGE = process.env.JOB_PAGE;
const HEADLESS = process.env.HEADLESS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let attempts = 0;

console.log("[START] starting handshake automation...");

async function main() {
  const browser = await loginHandshake();
  let page = await browser.newPage();
  await page.goto(`${JOB_PAGE}`);

  page.setDefaultTimeout(120000); // 2 minutes in milliseconds

  try {
    // initialize jobs currently being displayed
    await page.waitForSelector(`[data-hook="jobs-card"]`);
    const jobElements = await page.$$(`[data-hook="jobs-card"]`);
    let jobIds = await Promise.all(
      jobElements.map((job) => job.evaluate((el) => el.id))
    );

    // search for new jobs every 5 minutes
    while (true) {
      try {
        await page.waitForSelector(`[data-hook="jobs-card"]`);
      } catch (error) {
        if (attempts > 3) {
          console.log("[!] too many attempts, exiting...");
          await browser.close();
          process.exit(0);
        }
        attempts++;
        console.log("[!] not detecting jobs, reopening job page...");
        await page.close();
        page = await browser.newPage();
        await page.goto(`${JOB_PAGE}`);
        continue;
      }
      const currJobElements = await page.$$(`[data-hook="jobs-card"]`);
      const currJobIds = await Promise.all(
        currJobElements.map((job) => job.evaluate((el) => el.id))
      );
      const newJobsIds = currJobIds.filter((id) => !jobIds.includes(id));

      // notify of new jobs
      if (newJobsIds.length > 0) {
        for (let newJobId of newJobsIds) {
          const newJob = await page.$(`#${newJobId}`);
          const jobLink = await newJob.evaluate((el) =>
            el.getAttribute("href")
          );
          const jobTitle = await newJob.$eval("h3", (el) =>
            el.textContent.trim()
          );

          const companyName = await newJob.$eval(
            "div > div > div > span",
            (el) => el.textContent.trim()
          );

          sendEmail(
            jobTitle,
            `https://app.joinhandshake.com${jobLink}`,
            companyName
          );
        }
        console.log("[FOUND NEW JOBS] email sent?");
        jobIds = currJobIds;
      } else {
        console.log("[NO NEW JOBS] " + new Date().toLocaleString());
      }
      await page.reload();
      await sleep(5 * 60 * 1000); // 5 minutes
    }
  } catch (error) {
    console.log("[ERROR]");
    console.error(error);
    await browser.close();
  } finally {
    console.log("[FINISH] closing browser...");
    await browser.close();
  }
}

async function loginHandshake() {
  const browser = await puppeteer.launch({
    headless: HEADLESS === "true",
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
    const loginPage = await browser.newPage();

    await loginPage.setDefaultTimeout(120000); // 2 minutes in milliseconds

    await loginPage.goto(
      "https://lehigh.joinhandshake.com/login?ref=app-domain"
    );
    console.log("[SUCCESS]");

    // login
    try {
      console.log("[2] logging in...");
      const ssoButton = await loginPage.waitForSelector(".sso-button");
      await ssoButton.click();
      await loginPage.waitForSelector("#username");
      await loginPage.type("#username", USERNAME);
      await loginPage.type("#password", PASSWORD);

      await loginPage.waitForSelector("#regularsubmit");
      await loginPage.click("#regularsubmit");

      await loginPage.waitForSelector("#trust-browser-button");
      await loginPage.click("#trust-browser-button");
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      await browser.close();
      process.exit(0);
    }

    await loginPage.waitForFunction(
      'window.location.href === "https://lehigh.joinhandshake.com/explore"'
    );
    await loginPage.waitForNavigation({ waitUntil: "load" });

    await loginPage.close();

    console.log("[SUCCESS LOGIN]");
    return browser;
  } catch (error) {
    console.log("[ERROR LOGIN]");
    console.error(error);
    await browser.close();
    return;
  }
}

main();
