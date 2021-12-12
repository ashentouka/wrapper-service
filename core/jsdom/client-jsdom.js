{
    const axios = require("axios");
    const ProxyAgent = require ("simple-proxy-agent");
/*    const userAgent = (function (){
        const ua = new ({UserAgent} = require("user-agents"))();
        return ua.random();
    })();*/
    const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.51 Safari/537.36";

    function client (url, opts, cb) {
        let axiosOpts = {
            headers: {userAgent},
            timeout: 30000
        }
        if (opts && opts.proxy) {
            let agent = new ProxyAgent(opts.proxy);
            Object.assign(axiosOpts, {
                httpAgent: agent,
                httpsAgent: agent
            })
        }

        axios.get(url, axiosOpts)
            .then(function (res) {
                const jsdom = require("jsdom");
                let loadOpts = {
                    userAgent: userAgent,
                }
                if (opts && opts.proxy) loadOpts.proxy = new ProxyAgent(opts.proxy);
                const resourceLoader = new jsdom.ResourceLoader(loadOpts);
                const html = res.data;
                const dom = new jsdom.JSDOM(html, {
                    resources: resourceLoader,
                    runScripts: "dangerously",
                    pretendToBeVisual: true,

                });

                const window = dom.window;
                const document = window.document;
                window.requestAnimationFrame(timestamp => {});
                const $ = require('jquery-jsdom');
                $(dom);

                cb(null, $);

            })
            .catch(cb)
            .then(function () {
                // always executed
            });
    }

    module.exports = client
}