import "dotenv/config";
import puppeteer from "puppeteer"; // puppeteer-extra
import sendEmail from "./sendEmail.js";
//import StealthPlugin from "puppeteer-extra-plugin-stealth";

const username = process.env.HANDSHAKE_USERNAME;
const password = process.env.HANDSHAKE_PASSWORD;
const town = process.env.TOWN;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("[START] starting handshake automation...");

async function main() {
  let init = await initializeHandshake();

  if (!init) {
    return;
  }

  let browser = init.browser;
  let page = init.page;

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
        console.log("[!] not detecting jobs, reinitializing handshake...");
        await browser.close();
        init = await initializeHandshake();
        if (!init) {
          return;
        }
        browser = init.browser;
        page = init.page;
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

    await page.setDefaultTimeout(120000); // 2 minutes in milliseconds

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
      await browser.close();
      return;
    }

    // Close modal
    try {
      console.log("[3] closing modal...");
      const closeButton =
        'button[data-hook="close-bootstrapping-follows-modal"]';
      await page.waitForSelector(closeButton);
      await page.click(closeButton);
      await page.waitForSelector(closeButton, { hidden: true });
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      await browser.close();
      return;
    }

    // Click Jobs link
    try {
      console.log("[4] navigating to jobs page...");
      const jobsChild = await page.waitForSelector("text/Jobs");
      const jobsParent = await jobsChild.evaluateHandle(
        (el) => el.parentElement
      );
      await jobsParent.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      await browser.close();
      return;
    }

    // // Click Location button
    // try {
    //   console.log("[5] clicking location filter...");
    //   await page.waitForSelector(".style__pill-content___QMdlA");
    //   const filterButtons = await page.$$(".style__pill-content___QMdlA");
    //   await filterButtons[0].click();
    //   console.log("[SUCCESS]");
    // } catch (error) {
    //   console.log("[ERROR]");
    //   console.error(error);
    //   await browser.close();
    //   return;
    // }

    // // Search for town
    // try {
    //   console.log("[6] searching for town...");
    //   await page.waitForSelector("#locations-filter");
    //   await page.type("#locations-filter", town);
    //   await sleep(2000);
    //   const checkboxes = await page.$$('input[type="checkbox"]');
    //   await checkboxes[0].click();
    //   console.log("[SUCCESS]");
    // } catch (error) {
    //   console.log("[ERROR]");
    //   console.error(error);
    //   await browser.close();
    //   return;
    // }

    // click internship button
    // try {
    //   console.log("[7] clicking internship button...");
    //   await page.waitForSelector(".style__pill-content___QMdlA");
    //   const filterButtons = await page.$$(".style__pill-content___QMdlA");
    //   await filterButtons[2].click();
    //   console.log("[SUCCESS]");
    // } catch (error) {
    //   console.log("[ERROR]");
    //   console.error(error);
    //   await browser.close();
    //   return;
    // }

    // filter by date
    try {
      console.log("[8] filtering by date...");
      const sortByButton = await page.waitForSelector(
        "button[data-hook='button'][aria-label='Filter by']"
      );
      await sortByButton.click();
      const sortByOptions = await page.waitForSelector("#sort-by-created_at");
      await sortByOptions.click();
      console.log("[SUCCESS]");
    } catch (error) {
      console.log("[ERROR]");
      console.error(error);
      await browser.close();
      return;
    }

    console.log("[SUCCESS INITIALIZING]");
    return { browser, page };
  } catch (error) {
    console.log("[ERROR INITIALIZING]");
    console.error(error);
    await browser.close();
    return;
  }
}

main();
