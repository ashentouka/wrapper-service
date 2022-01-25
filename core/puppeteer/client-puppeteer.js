{
    const createBrowserless = require('@browserless/pool');
    const useProxy = require('puppeteer-page-proxy');
    const ua = new ({UserAgent} = require("user-agents"))();

    const POOL_OPTS = {
        max: 20, // max browsers to keep open
        timeout: 30000 // max time a browser is considered fresh
    };

    const LAUNCH_OPTS = {
        headless: true,
        args: [
            `--user-agent=${ua.random()}`,
            `--no-sandbox`
        ]
    };

    const browserlessPool = createBrowserless(POOL_OPTS, LAUNCH_OPTS);

    function client(url, opts, cb) {
        (async () => {
            const browserless = await browserlessPool.createContext();

            try {
                const page = await browserless.page();
                if (opts && opts.proxy) {
                    useProxy(page, opts.proxy);
                }

                const closeout = function () {
                    (async () => {
                        await page.close();
                        await browserless.destroyContext();
                    })();
                };

                if (opts && opts.cookies) {
                    const _cookies = [];
                    for (let key in opts.cookies) {
                        _cookies.push({
                            'name': key,
                            'value': opts.cookies[key]
                        })
                    }

                    await page.setCookie(..._cookies);
                }

                await page.goto(url);
                cb(null, {page, closeout});

            } catch (exx) {
                await browserless.destroyContext();
                cb(exx)
            }
        })();
    }

    module.exports = client
}