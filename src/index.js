import "dotenv/config";
import puppeteer from "puppeteer-extra";
import sendEmail from "./sendEmail.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const JOB_PAGE =
  "https://www.lockheedmartinjobs.com/search-jobs/intern/King%20of%20Prussia%2C%20PA/694/1/4/6252001-6254927-5201756-5216850-5196220/40x08927/-75x39602/5/2";
const HEADLESS = process.env.HEADLESS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("[START] starting handshake automation...");

async function main() {
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
  let page = await browser.newPage();
  await page.goto(`${JOB_PAGE}`);

  page.setDefaultTimeout(60000); // 1 minute in milliseconds

  try {
    // initialize jobs currently being displayed
    await page.waitForSelector(`#search-results-list ul li`);
    const jobs = await page.$$eval("#search-results-list ul li", (items) => {
      return items.map((li) => {
        const title = li.querySelector(".job-title")?.textContent.trim();
        const location = li.querySelector(".job-location")?.textContent.trim();
        const datePosted = li.querySelector(".job-date-posted")?.textContent.trim();
        const jobId = li.querySelector(".job-id")?.textContent.trim();
        const link = li.querySelector("a")?.href;
        return { title, location, datePosted, jobId, link };
      });
    });

    sendEmail(jobs[0]);

    // search for new jobs
    let attempts = 0;
    while (true) {
      try {
        await page.waitForSelector(`#search-results-list ul li`);
      } catch (error) {
        if (attempts > 3) {
          await page.screenshot({ path: `error_screenshot_${Date.now()}.png` });
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
      const currJobs = await page.$$eval("#search-results-list ul li", (items) => {
        return items.map((li) => {
          const title = li.querySelector(".job-title")?.textContent.trim();
          const location = li.querySelector(".job-location")?.textContent.trim();
          const datePosted = li.querySelector(".job-date-posted")?.textContent.trim();
          const jobId = li.querySelector(".job-id")?.textContent.trim();
          const link = li.querySelector("a")?.href;
          return { title, location, datePosted, jobId, link };
        });
      });

      const existingJobIds = jobs.map((j) => j.jobId);
      const newJobs = currJobs.filter((job) => !existingJobIds.includes(job.jobId));

      // notify of new jobs
      if (newJobs.length > 0) {
        for (const newJob of newJobs) {
          sendEmail(newJob);
        }
        console.log("[FOUND NEW JOBS] email sent?");
        jobs.push(...newJobs);
      } else {
        console.log("[NO NEW JOBS] " + new Date().toLocaleString());
      }
      await page.reload();
      await sleep(3 * 60 * 60 * 1000); // 3 hours
    }
  } catch (error) {
    await page.screenshot({ path: `error_screenshot_${Date.now()}.png` });
    console.log("[ERROR]");
    console.error(error);
  } finally {
    console.log("[FINISH] closing browser...");
    await browser.close();
  }
}

main();
