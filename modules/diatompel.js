{
    const rowparser = require("../core/puppeteer/rowparser")
    const client = require('../core/puppeteer/client-puppeteer');
    const loader = require('../core/cached-scraper');

    function runner(proto) {
        let path = `https://ditatompel.com/proxy/type/${proto}`;

        function parser(cb) {
            client(path, null, (e, d) => {
                if (!e) {
                    (async () => {
                        const {page, closeout} = d;

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
                                    closeout();
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
            return loader(path, proto, { auto: 2 * 60 * 1000, ttl: { refresh: 1 * 60 * 1000 }}, parser);
        }
    }

    module.exports = {
        http: runner("http"),
        https: runner("https"),
        socks5: runner("socks5")
    }
}
