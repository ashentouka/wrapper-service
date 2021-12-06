{
    const client = require("./client-puppeteer");

    let api = {
        table(path, source, cb) {
            client(path, null, (e, d) => {
                if (!e) {
                    (async () => {
                        const {page, browser} = d;
                        await page.waitForSelector(source.selector, 10000);
                        const text = await page.evaluate(function (source) {
                            const ip_regex = /([1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2})/;
                            const ip_port_regex = /([1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}:\d{2,6})/;
                            let vv = document.querySelectorAll(source.selector);

                            if (vv) {
                                let outp = [];
                                let fc;
                                for (let idx = 0; idx < vv.length; idx++) {
                                    let cells = vv[idx].querySelectorAll("td");
                                    if (cells && cells.length > 1) {
                                        fc = cells.length;
                                        let ip = cells[0].innerText;
                                        if (ip_port_regex.test(ip)) {
                                            outp.push(ip);
                                        } else if (ip_regex.test(ip)) {
                                            let port = cells[1].innerText;
                                            let ip_port = `${ip}:${port}`;
                                            outp.push(ip_port);
                                        }
                                    }
                                }
                                return outp;
                            }
                        }, source)

                        cb(null, text);

                        browser.close();
                    })();
                } else {
                    cb(e);
                    browser.close();
                }
            });
        },

        paged(path, source, cb) {

            let proxy_data = [];

            function _prox(pg) {
                api.table(path + pg, source, (e, d) => {
                    if (e) {
                        console.log(e.message);
                        cb(e)

                    } else {
                        console.log(pg, d)
                        proxy_data = proxy_data.concat(d)
                        if (pg < source.maxpage) {
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