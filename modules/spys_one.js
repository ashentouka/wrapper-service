{
    const rowparser = require("../core/puppeteer/rowparser")
    const client = require('../core/puppeteer/client-puppeteer');
    const loader = require('../core/cached-scraper');

    function runner(proto) {
        let path = `https://spys.one/en/${proto}-proxy-list`;

        function parser(cb) {
            client(path, null, (e, d) => {
                if (!e) {

                    const {page, browser} = d;

                    function evalFilter(submit) {
                        (async () => {
                            await page.waitForSelector("body table table");
                            const rows = await page.evaluate(function () {
                                let trz = document.querySelectorAll("tr.spy1x,tr.spy1xx");
                                return trz ? trz.length : 0;
                            });

                            console.log("spys.one", proto, rows);

                            if (rows < 100) {
                                if (!submit) {
                                    await page.waitForSelector("#xpp");
                                    await page.evaluate(function () {
                                        let selbox = document.getElementById('xpp');
                                        selbox.selectedIndex = 5;
                                        selbox.form.submit()
                                    });
                                    await page.waitForNavigation({waitUntil: "domcontentloaded"});
                                    console.log("filter changed");
                                    evalFilter(true);

                                } else {
                                    await page.reload({waitUntil: "domcontentloaded"});
                                    setTimeout(function () {
                                        console.log("filter error trying refresh");
                                        evalFilter(false)
                                    }, 500);
                                }

                            } else {
                                const text = await page.evaluate(rowparser, {selector: "tr.spy1x,tr.spy1xx"});
                                await browser.close();
                                cb(null, text);
                            }
                        })();
                    }

                    evalFilter(false);
                } else {
                    cb(e);
                }
            });
        }

        return function () {
            return loader(path, parser);
        }
    }

    module.exports = {
        http: runner("http"),
        socks5: runner("socks")
    }
}
