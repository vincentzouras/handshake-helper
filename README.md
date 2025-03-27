# Handshake Helper

Sends you an email the second a new job is posted near you on Handshake.

This was built with Node.js and the Puppeteer library, and designed to be ran on a server so it can provide updates in real time.

# Installation

You can test that everything works on your own device first, but afterwards you should run it on the cloud or your own server (I use an old Chromebook with Ubuntu Server, easy to set up thanks to [MrChromebox](https://docs.mrchromebox.tech/))

1. Clone this repo
2. Add an `.env` file with the following:

```bash
HANDSHAKE_USERNAME=""
HANDSHAKE_PASSWORD=""
TOWN="Bethlehem, Pennsylvania"
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_TO=""
```

> Make sure the city and state is written correctly

3. Run the file using `npm start`
