{
    const createBrowserless = require('browserless');

    const ua = new ({UserAgent} = require("user-agents"))();

    function client(url, proxy, cb) {
        try {
            (async () => {
                const opts = {
                    headless: true,
                    args: [
                        `--user-agent=${ua.random()}`
                    ]
                };

                if (proxy) opts.args.push(`--proxy-server"=${proxy}`);

                const browserlessFactory = createBrowserless({ launchOpts: opts });
                const browserless = await browserlessFactory.createContext();
                const browser = await browserless.browser();
                const page = await browserless.page();
                await page.goto(url);

                cb(null, {page, browser});
            })();
        } catch (exx) {
            cb(exx)
        }
    }

    module.exports = client
}