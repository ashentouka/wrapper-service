{
    const DEBUG = true;
    const path = require("path");

    const CACHE_TTL_UPSTREAM_OKAY_MINUTES = 120;
    const CACHE_TTL_ON_ERROR_MINUTES = 6 * 60;

    function loadNew(nom, f, retries, noReject) {
        function load() {
            return new Promise((__resolve, reject) => {
                function resolve(obj) {
                    obj.loader = load;
                    __resolve(obj);
                }
                (async () => {
                    const {Low, JSONFile} = await import("lowdb");
                    const db = new Low(new JSONFile(path.join(__dirname, "cache.json")));
                    await db.read();
                    db.data ||= {[nom]: {loaded: 0, data: []}};

                    let out = db.data[nom] || {loaded: 0, data: []};

                    let millis = new Date().getTime() - out.loaded;
                    if (DEBUG && out.loaded > 0) console.log(`cache entry age [${millis / 1000} seconds]`);
                    if (out.loaded === 0 || millis > CACHE_TTL_UPSTREAM_OKAY_MINUTES * 60 * 1000) {
                        f((e, d) => {
                            if (e) {
                                if (DEBUG) console.log(`there was an error...`);
                                if (DEBUG) console.log(e.message);
                                if (retries && retries > 2) {
                                    console.log(`attempted ${retries} retries, send error to client.`);
                                    if (!noReject) {
                                        reject(e);
                                    } else {
                                        resolve(out);
                                    }
                                } else {
                                    if (out.loaded === 0 || millis > CACHE_TTL_ON_ERROR_MINUTES * 60 * 1000) {
                                        if (DEBUG) console.log(`...cache is too stale or has no data, attempting one retry.`);
                                        setTimeout(() => {
                                            loadNew(nom, f, retries ? retries + 1 : 1)
                                                .then(out => resolve(out))
                                                .catch(e => function(e){
                                                    if (!noReject) {
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
                                    out = {loaded: new Date().getTime(), data: d};
                                    if (DEBUG) console.log(`scraped fresh data from the source html [${out.data.length} entries]`);
                                    db.data[nom] = out;
                                    await db.write();
                                    resolve(out);
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