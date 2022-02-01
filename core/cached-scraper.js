{
    const DEBUG = true;

    const CACHE_TTL_UPSTREAM_OKAY_MINUTES = 120;
    const CACHE_TTL_ON_ERROR_MINUTES = 240;

    function loadNew(uri, protocol, opts, f, retries) {
        opts ||= { ttl:{}};
        opts.ttl ||= {};
        opts.ttl.refesh ||= CACHE_TTL_UPSTREAM_OKAY_MINUTES;
        opts.ttl.error ||= CACHE_TTL_ON_ERROR_MINUTES;

        function load() {
            return new Promise((__resolve, reject) => {
                function resolve(obj) {
                    obj.loader = load;
                    __resolve(obj);
                }
                (async () => {
                    const datasource = require("./datasource");
                    let out = await datasource.loadCache();
                    out ||= { loaded: 0, url: uri, protocol:protocol, data: []};

                    let millis = new Date().getTime() - out.loaded;
                    if (DEBUG && out.loaded > 0) console.log(`cache entry age [${millis / 1000} seconds][ttl: ${opts.ttl.refesh}]`);
                    if (out.loaded === 0 || millis > opts.ttl.refesh) {
                        f((e, d) => {
                            if (e) {
                                if (DEBUG) console.log(`there was an error...`);
                                if (DEBUG) console.log(e.message);
                                if (retries && retries > 2) {
                                    console.log(`attempted ${retries} retries, send error to client.`);
                                    if (!opts.noReject) {
                                        reject(e);
                                    } else {
                                        resolve(out);
                                    }
                                } else {
                                    if (out.loaded === 0 || millis > opts.ttl.error) {
                                        if (DEBUG) console.log(`...cache is too stale or has no data, attempting one retry.`);
                                        setTimeout(() => {
                                            loadNew(uri, f, opts, retries ? retries + 1 : 1)
                                                .then(out => resolve(out))
                                                .catch(e => function(e){
                                                    if (!opts.noReject) {
                                                        reject(e);
                                                    } else {
                                                        resolve(out);
                                                    }
                                                });
                                        }, 500);
                                    } else {
                                        if (DEBUG) console.log(`...returning last good cache.`);
                                        resolve(out);
                                    }
                                }

                            } else {
                                (async () => {
                                    out = {loaded: new Date().getTime(), protocol:protocol, url: uri, data: d};
                                    if (DEBUG) console.log(`scraped fresh data from the source html [${out.data.length} entries]`);

                                    await datasource.updateCache(uri, out);
                                    resolve(out);

                                    if (opts.auto) {
                                        setTimeout(()=>{
                                            load();
                                        },opts.auto)
                                    }
                                })();
                            }
                        })
                    } else {
                        if (DEBUG) console.log(`cache data is "new" enough [${out.data.length} entries]`);
                        resolve(out);
                    }
                })()
            });

        }
        return load();
    }

    module.exports = loadNew;
}