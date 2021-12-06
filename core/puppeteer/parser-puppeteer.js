{
    const client = require("./client-puppeteer");
    const rowparser = require("./rowparser");

    let api = {
        table(path, source, cb) {
            client(path, null, (e, d) => {
                if (!e) {
                    (async () => {
                        const {page, browser} = d;
                        await page.waitForSelector(source.selector, 10000);
                        const text = await page.evaluate(rowparser, source)

                        cb(null, text);

                        browser.close();
                    })();
                } else {
                    cb(e);
                }
            });
        },

        paged(path, source, cb) {
            let proxy_data = [];

            function _prox(pg) {
                const pageout = (source.namedpages) ? source.namedpages[pg - 1] : pg;
                api.table(path + pageout, source, (e, d) => {
                    if (e) {
                        console.log(e.message);
                        cb(e)

                    } else {
                        console.log(pg, d)
                        proxy_data = proxy_data.concat(d)
                        if (pg < source.maxpage || source.namedpages.length) {
                            setTimeout(function () {
                                _prox(pg + 1)
                            }, 500);
                        } else {
                            cb(null, proxy_data);
                        }
                    }
                });
            }

            _prox(1);
        },
    }

    module.exports = api;
}