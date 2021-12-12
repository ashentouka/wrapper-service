{
    const rowparser = require("../core/puppeteer/rowparser")
    const client = require('../core/puppeteer/client-puppeteer');
    const loader = require('../core/cached-scraper');

    function runner(proto) {
        let urlbase = `https://hidemy.name/en/proxy-list/?type=${proto}`;
        let hash = "#list";
        function parser(cb) {
            let data = []
            let pager = 1;
            client(urlbase + hash, {}, (e, d) => {
                if (e) cb(e);
                else {
                    const {page, browser} = d;
                    (async () => {
                        async function paged() {
                           // console.log (await page.evaluate(function (){ return document.body.innerText }));
                            await page.waitForSelector("div.table_block table");
                           // await page.waitForTimeout(1000);
                                const proxy = await page.evaluate(rowparser, {selector: "div.table_block table tbody tr"});
                                data = data.concat(proxy);

                                let clicker = await page.evaluate(function (pager){
                                    let link = document.querySelectorAll(pager > 1 ? ".pagination li.active" : ".pagination li.is-active + li");
                                    if (link.length > 0 && link[0].className === "next_array") link = [];
                                    return link.length;
                                },pager);
console.log(clicker);
                                console.log(`page ${pager}: ${proxy.length}`);

                                if (clicker > 0 && pager < 24) {
                                    await page.goto(urlbase + "&start=" + (64*pager) + hash);
                                    pager++;
                                    //await page.waitForNavigation({waitUntil: "domcontentloaded"});
                                    await paged();
                                } else {
                                    browser.close();
                                    cb(null,data);
                                }
                        }

                        await paged();
                    })()
                }
            })
        }

        return function () {
            return loader(urlbase, parser);
        }
    }

    module.exports = {
        "socks4": runner("4"),
        "socks5": runner("5"),
        "http": runner("h"),
        "https": runner("s"),
    };
}