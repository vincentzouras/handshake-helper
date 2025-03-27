import "dotenv/config";
import nodemailer from "nodemailer";

const email = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const emailTo = process.env.EMAIL_TO;

//  SMTP details
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: pass,
  },
});

const sendEmail = (jobTitle, jobLink, companyName) => {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>New Job Opportunity</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 0; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; font-size: 24px; }
        .content { padding: 30px; text-align: left; }
        .job-title { font-size: 22px; font-weight: bold; color: #2c3e50; }
        .company-name { font-size: 18px; margin: 10px 0; color: #555; }
        .cta-button { display: inline-block; padding: 12px 20px; margin-top: 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; }
        .cta-button:hover { background-color: #45a049; }
        .footer { text-align: center; padding: 15px; font-size: 14px; color: #777; background-color: #f1f1f1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">🌟 New Job Opportunity 🌟</div>

        <div class="content">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>

          <p>Click below to view the full job description and apply:</p>
          <a href="${jobLink}" class="cta-button" target="_blank">View Job</a>
        </div>

        <div class="footer">2025 Vincent Zouras</div>
      </div>
    </body>
    </html>
  `;
  // Set up email data
  let mailOptions = {
    from: email,
    to: emailTo,
    subject: `[JOB ALERT] ${jobTitle}`,
    html: htmlContent,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("[EMAIL ERROR]");
      console.error(error);
    } else {
      console.log("[EMAIL SUCCESS]");
      console.log(info.response);
    }
  });
};

export default sendEmail;
