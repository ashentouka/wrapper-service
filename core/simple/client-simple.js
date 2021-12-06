{

    const axios = require("axios");
    const ua = new ({UserAgent} = require("user-agents"))();
    // const ProxyAgent = require("simple-proxy-agent");

    function __base(meth, then, url, proxy, data, cb) {
        const userAgent = ua.random();
        let axiosOpts = {
            headers: {"User-Agent": userAgent},
            timeout: meth === "head" ? 3000 : 30000
        }

/*        if (proxy) {
            let agent = new ProxyAgent(proxy);
            Object.assign(axiosOpts, {
                httpAgent: agent,
                httpsAgent: agent
            })
        }*/
        try {
            if (meth === "post") {
                axios.post(url, data, axiosOpts)
                    .then(then(cb))
                    .catch(cb)
            } else {
                axios[meth](url, axiosOpts)
                    .then(then(cb))
                    .catch(cb)
            }
        } catch (e) {
            cb(e);
        }
    }

    function contentTypeRouting(cb) {
        return function (res) {

            if (res.status >= 200 && res.status < 400) {
                let content_type = res.headers['content-type'];
                if (content_type.indexOf("; charset=") > 0) content_type = content_type.split("; charset=")[0]

                if (content_type === "text/html") {

                    const html = res.data;
                    const cheerio = require("cheerio");
                    let $ = cheerio.load(html);

                    cb(null, {type: "html", data: $})

                } else {
                    let typed = typeof res.data;
                    cb(null, {type: (typed === "object" ? "json" : typed), data: res.data});
                }

            } else {
                cb(new Error(`HTTP Error Status ${res.status}`));
            }
        }
    }


    module.exports = {
        client: (url, proxy, cb) => {
            __base( "get", contentTypeRouting, url, proxy, null, cb);
        },

        post: (url, proxy, data, cb) => {
            __base( "post", contentTypeRouting, url, proxy, data, cb);
        },

        paged: (url, proxy, cb) => {

            let gather;
            let total;
            const LIMIT = 200;

            function _next_(page) {
                let uri = url + (url.indexOf("?") > -1 ? "&" : "?") + `limit=${LIMIT}&page=${page}`;
                __base( "get", contentTypeRouting, uri, proxy, null, (e, d) => {
                    if (e && page === 1) {
                        cb(e);
                    } else {
                        if (d) {
                            let data = d.data;
                            total = total || data.total;
                            let newg = (gather ? gather.concat(data.data) : data.data);
                            if (LIMIT * page < total) {
                                gather = newg;
                                _next_(page + 1);
                            } else {
                                cb(null, newg);
                            }
                        }
                    }
                });
            }

            _next_(1);

        },

        test: (url, proxy, cb) => {
            function then(res) {
                if (res.status >= 200 && res.status < 400) {
                    cb(null, true);
                } else {
                    cb(new Error(`HTTP Error Status ${res.status}`));
                }
            }

            __base("head", then, url, proxy, null, cb);
        },

        ipinfo: (proxy, cb) => {
            __base("get", res => cb(null, res.data), "http://ipinfo.io/json", proxy, null, cb)
        }
    }

}