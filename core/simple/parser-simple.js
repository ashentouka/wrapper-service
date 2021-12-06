{
    const DEBUG = false;

    const client = require("./client-simple");

    const ip_regex = /([1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2})/
    const ip_port_regex = /([1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}:\d{2,6})/;

    const api = {
        rest (path, source, cb) {
            client.paged(path, null, cb);
        },

        plaintext (path, source, cb) {
            client.client(path, null, (e,d)=>{
                cb(e,d?d.data:null)
            });
        },

        paged (path, source, cb) {

            let proxy_data = [];
            function _prox(pg) {
                api.table(path+pg,source, (e,d)=>{
                    if (e) {
                        console.log(e.message);
                        cb(e)

                    } else {
                        proxy_data = proxy_data.concat(d)
                        if (pg < source.maxpage) {
                            setTimeout(function (){_prox(pg + 1)},500);
                        } else {
                            cb(null,proxy_data);
                        }
                    }
                });
            }
            _prox(1);
        },

        table (path, source, cb) {
            function _int_cb_ (e,d) {
                if (!e && d.type === "html"){
                    let $ = d.data;
                    let rows = $(source.selector);
                    if (DEBUG) console.log("rows",rows);
                    let outp = [];
                    for (let idx = 0; idx < rows.length; idx++){
                        let cells = $(rows[idx]).find("td");
                        if (DEBUG) console.log(cells.length);
                        let ip = $(cells[0]).html();
                        if (ip_port_regex.test(ip)) {
                            outp.push(ip);
                        } else if (ip_regex.test(ip)) {
                            let port = $(cells[1]).html();
                            let ip_port = `${ip}:${port}`;
                            outp.push(ip_port);
                        }
                    }
                    cb(null,outp);
                } else {
                    cb(e)
                }
            }
            client.client(path, null, _int_cb_);

        }
    }

    module.exports = api
}
