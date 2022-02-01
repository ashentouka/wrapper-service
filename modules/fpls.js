{
    const rowparser = require("../core/puppeteer/rowparser")
    const client = require('../core/puppeteer/client-puppeteer');
    const loader = require('../core/cached-scraper');

    function runner() {

        function parser(cb) {
            let data = []
            let pager = 1;
            client("https://www.google.com/search?q=freeproxylists.net", {}, (e, d) => {
                if (e) cb(e);
                else {
                    (async () => {
                        const {page, closeout} = d;
                        await page.evaluate(function () {
                            document.querySelector("#search a").click();
                        })

                        async function paged() {

                            try {
                                await page.waitForNavigation({waitUntil: "domcontentloaded"});
                                await page.waitForSelector("table.DataGrid");
                                if (paged === 1) await page.waitForTimeout(3000);
                                const proxy = await page.evaluate(rowparser, {selector: "tr.Even,tr.Odd"});
                                data = data.concat(proxy);

                                let clicker = await page.evaluate(function () {
                                    let link = document.querySelectorAll("span.current + a");
                                    if (link.length > 0) {
                                        link[0].click();
                                    }
                                    return link.length;
                                })

                                console.log(`page ${pager}: ${proxy.length}`);

                                if (clicker > 0) {
                                    pager++;
                                    await paged();
                                } else {
                                    closeout();
                                    cb(null, data);
                                }
                            } catch (exx) {
                                closeout()
                                cb(exx);
                            }
                        }

                        await paged();
                    })()
                }
            })
        }

        return function () {
            return loader(`https://freeproxylists.net`, proto, parser);
        }
    }

    module.exports = runner();
}