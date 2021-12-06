{
    //const createBrowserless = require('browserless');

    const puppeteer = require('puppeteer');

    const ua = new ({UserAgent} = require("user-agents"))();

    function client(url, proxy, cb) {
        try {
            (async () => {
                const opts = {
                    headless: true,
                    args: [
                        `--user-agent=${ua.random()}`,
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
                };

                if (proxy) opts.args.push(`--proxy-server"=${proxy}`);

               // const browserlessFactory = createBrowserless({ launchOpts: opts });
               // const browserless = await browserlessFactory.createContext();
               // const browser = await browserless.browser();
               // const page = await browserless.page();

                const browser = await puppeteer.launch(opts);

                const page = await browser.newPage();
                await page.goto(url);

                cb(null, {page, browser});
            })();
        } catch (exx) {
            cb(exx)
        }
    }

    module.exports = client
}