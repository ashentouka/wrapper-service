#!/usr/bin/node
{

    const express = require('express'),
        path = require("path"),
        async = require("async"),

        m_spys = require("./modules/spys_one"),
        m_fpls = require("./modules/fpls"),
        m_pld = require("./modules/proxy-list-dl"),
        m_dia = require("./modules/diatompel"),
        m_hide = require("./modules/hidemy"),
        m_iploc = require("./modules/iploc"),

        loader = require("./core/cached-scraper");
    app = express();

    app.use("/", express.static(path.join(__dirname,"www")));

    function composeArray(arr){
        let text = "";
        for (let idx = 0; idx < arr.length; idx++) {
            text += arr[idx] + "\n";
        }
        return text;
    }

    let queue = async.queue((task, callback) => {
        console.log(`Preload Queue: ${task.resturi}`);
        task.load().then(function (output){
            app.get(task.resturi, (req, res) => {
                (async()=>{
                    let puts = await output.loader();
                    res.contentType("text/plain");
                    res.send(composeArray(puts.data));
                })()
            });
            console.log(`Preload Complete: ${task.resturi} [${output.data.length} proxies]`);
            callback();
        })
    }, 1);

    queue.push({
        resturi: `/proxies/iploc/http`,
        load: m_iploc
    })

/*  TODO Disabled until script is fixed... captcha?
    queue.push({
        resturi: `/proxies/fpls/http`,
        load: m_fpls
    })*/

    queue.push({
        resturi: "/proxies/nova/http",
        load: function (){
            const parser = require("./core/puppeteer/parser-puppeteer");
            const url = "https://www.proxynova.com/proxy-server-list";
            return loader(url, function (cb){
                parser.paged(url, {selector: "#tbl_proxy_list tbody tr", namedpages: [ "/anonymous-proxies/", "/elite-proxies/" ]}, cb);
            })
        }
    })

    queue.push({
        resturi: "/proxies/f-p-l/http",
        load:   function () {
            const parser = require("./core/simple/parser-simple");
            const url = "https://free-proxy-list.net";
            return loader(url, function (cb) {
                parser.table(url, {selector: "div.fpl-list table tbody tr"}, cb);
            })
        }
    })

    let all_protocols = ['http', 'https', 'socks4', 'socks5'];
    for (let proto_idx in all_protocols) {
        let proto = all_protocols[proto_idx];
        queue.push({
            resturi: `/proxies/p-l-d/${proto}`,
            load: m_pld[proto]
        })
    }

    for (let proto_idx in all_protocols) {
        let proto = all_protocols[proto_idx];
        queue.push({
            resturi: `/proxies/hidemy/${proto}`,
            load: m_hide[proto]
        })
    }

    let spys_protocols = ['http', 'socks5'];
    for (let proto_idx in spys_protocols) {
        let proto = spys_protocols[proto_idx];
        queue.push({
            resturi: `/proxies/spys_one/${proto}`,
            load: m_spys[proto]
        })
    }

    let dia_protocols = ['http', 'https', 'socks5'];
    for (let proto_idx in dia_protocols) {
        let proto = dia_protocols[proto_idx];
        queue.push({
            resturi: `/proxies/diatompel/${proto}`,
            load: m_dia[proto]
        })
    }

    queue.drain(function (){
        console.log("Preload Conplete.");
    })

    let port = process.env["PORT"] || 7769;
    app.listen(port, () => console.log(`http://localhost:${port}/`));
}
