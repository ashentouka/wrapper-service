{
    const client = require("../core/simple/client-simple");
    const ip_port_regex = /([1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}\.[1-2]?\d{1,2}:\d{2,6})/;

    const loader = require("../core/cached-scraper");
    const FormData = require('form-data');

    function load_internal(type) {
        return (cb)=> {
            function parse(e, d) {
                if (!e) {
                    let outp = [];
                    let $ = d.data;
                    let rows = $("tr.spy1x,tr.spy1xx");

                    console.log("rows", rows.length);
                    for (let idx = 0; idx < rows.length; idx++) {
                        let cells = $(rows[idx]).find("td");
                        let ip = $(cells[0]).text();
                        if (ip_port_regex.test(ip)) {
                            outp.push(ip);
                        }

                        console.log(ip);
                    }
                    cb(null,outp);
                } else {
                    cb(e);
                }
            }

            client.client(`https://spys.one/en/${type}-proxy-list`, null, (e, d) => {
                let $ = d.data;
                let hash = $("input[name='xx0']").val();
                console.log("page loaded.", hash);

                const form_data = new FormData();
                form_data.append('xx0', hash);
                form_data.append('xpp', "5");
                form_data.append('xf1', "0");
                form_data.append('xf2', "0");
                form_data.append('xf4', "0");
                form_data.append('xf5', "2");

                client.post(`https://spys.one/en/${type}-proxy-list`, null, form_data, parse);
            })
        }
    }

    module.exports = {
        http: ()=>{
            return loader("spys-one-http", load_internal("http"))
        },

        socks: ()=>{
            return loader("spys-one-socks", load_internal("socks"))
        }
    }
}