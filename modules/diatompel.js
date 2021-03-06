{
    const rowparser = require("../core/puppeteer/rowparser")
    const client = require('../core/puppeteer/client-puppeteer');
    const loader = require('../core/cached-scraper');

    function runner(proto) {
        let path = `https://www.ditatompel.com/proxy/type/${proto}`;

        function parser(cb) {
            client(path, null, (e, d) => {
                if (!e) {
                    (async () => {
                        const {page, browser} = d;

                        await page.waitForSelector("select[name='proxyList_length']");
                        await page.evaluate(function () {
                            $("select[name='proxyList_length'] option[value='100']").attr("value", "300");
                            $("select[name='proxyList_length']").val("300").change();
                        });

                        function testo() {
                            setTimeout(function (){
                            (async () => {
                                const count = await page.evaluate(function () {
                                    return $("#proxyList tbody tr").length;
                                });
                                if (count > 100) {
                                    const text = await page.evaluate(rowparser,{selector:"#proxyList tr"});
                                    await browser.close();
                                    cb(null, text);
                                } else {
                                    testo();
                                }

                            })();
                            },500);
                        }
                        testo();
                    })();
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
        https: runner("https"),
        socks5: runner("socks5")
    }
}
