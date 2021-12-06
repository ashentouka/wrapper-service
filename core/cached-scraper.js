{
    const DEBUG = false;
    const NodeCache = require("node-cache");
    const cache = new NodeCache();

    function loadNew(nom, f, retries){
        let out = cache.get(nom) || { loaded: 0, data: [] };
        return new Promise((resolve, reject) => {
            let millis = new Date().getTime() - out.loaded;
            if (DEBUG) console.log(`cache entry age [${millis / 1000} seconds]`);
            if (out.loaded === 0 || millis > 10 * 60 * 1000) {
                f((e,d)=>{
                    if (e) {
                        if(DEBUG) console.log(`there was an error...`);
                        if(DEBUG) console.log(e.message);
                        if (retries && retries > 2) {
                            console.log(`attempted ${retries} retries, send error to client.`);
                            reject(e);
                        } else {
                            if (out.loaded === 0 || millis > 30 * 60 * 1000) {
                                if(DEBUG) console.log(`...cache is too stale or has no data, attempting one retry.`);
                                setTimeout(() => {
                                    loadNew(nom,f, retries ? retries+1 : 1)
                                        .then(out => resolve(out))
                                        .catch(e => reject(e));
                                }, 500);
                            } else {
                                if(DEBUG) console.log(`...returning last good cache.`);
                                resolve(out);
                            }
                        }

                    } else {
                        if (d) out = {  loaded: new Date().getTime(), data: d };
                        if(DEBUG) console.log(`scraped fresh data from the source html [${out.data.length} entries]`);
                        cache.set(nom, out);
                        resolve(out);
                    }
                })
            } else {
                if(DEBUG) console.log(`cache data is "new" enough [${out.data.length} entries]`);
                resolve(out);
            }
        });
    }

    module.exports = loadNew

}