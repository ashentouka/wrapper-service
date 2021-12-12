#!/usr/bin/node
{

    const express = require('express'),
        path = require("path"),

       // cors = require("cors"),

        m_spys = require("./modules/spys_one"),
        m_fpls = require("./modules/fpls"),
        m_pld = require("./modules/proxy-list-dl"),
        m_dia = require("./modules/diatompel"),
        m_hide = require("./modules/hidemy"),
        loader = require("./core/cached-scraper");
    app = express();

    console.log(path.join(__dirname,"www"))

    app.use("/", express.static(path.join(__dirname,"www")));
    //app.use(cors());

    function composeArray(arr){
        let text = "";
        for (let idx = 0; idx < arr.length; idx++) {
            text += arr[idx] + "\n";
        }
        return text;
    }

    app.get("/proxies/f-p-l/http", (req,res)=>{
        const parser = require("./core/simple/parser-simple");
        const url = "https://free-proxy-list.net";
        loader(url, function (cb){
            parser.table(url, {selector: "div.fpl-list table tbody tr"}, cb);
        }).then(o => {
            console.log("/f-p-l results", o.data.length);
            res.contentType("text/plain");
            res.send(composeArray(o.data));
        }).catch(e => console.log(e));
    })

    app.get("/proxies/nova/http", (req,res)=>{
        const parser = require("./core/puppeteer/parser-puppeteer");
        const url = "https://www.proxynova.com/proxy-server-list";
        loader(url, function (cb){
            parser.table(url, {selector: "#tbl_proxy_list tbody tr", namedpages: [ "/anonymous-proxies/", "/elite-proxies/" ]}, cb);
        }).then(o => {
            console.log("/proxynova results", o.data.length);
            res.contentType("text/plain");
            res.send(composeArray(o.data));
        }).catch(e => console.log(e));
    })

/*    function cz(proto) {
        const parser = require("../core/puppeteer/parser-puppeteer");
        app.get(`/proxies/cz/${proto}`, (req, res) => {
            const url = `http://free-proxy.cz/en/proxylist/country/all/${proto}/ping/all/`;
            loader(url, function (cb){
                parser.paged(url, {selector: "#proxy_list tbody tr", maxpage: 5}, cb)
            }).then(o => {
                console.log("/cz results", o.data.length);
                res.contentType("text/plain");
                res.send(composeArray(o.data));
            }).catch(e => console.log(e));
        })
    }*/

    function spys(proto) {
        app.get(`/proxies/spys_one/${proto}`, (req, res) => {
            m_spys[proto]().then(spys => {
                console.log(`/spys_one/${proto} results`, spys.data.length);
                res.contentType("text/plain");
                res.send(composeArray(spys.data));
            }).catch(e => console.log(e));
        });
    }

    function dia(proto) {
        app.get(`/proxies/diatompel/${proto}`, (req, res) => {
            m_dia[proto]().then(dia => {
                console.log(`/diatompel/${proto} results`, dia.data.length);
                res.contentType("text/plain");
                res.send(composeArray(dia.data));
            }).catch(e => console.log(e));
        });
    }

    function hide(proto) {
        app.get(`/proxies/hidemy/${proto}`, (req, res) => {
            m_hide[proto]().then(dia => {
                console.log(`/hidemy/${proto} results`, dia.data.length);
                res.contentType("text/plain");
                res.send(composeArray(dia.data));
            }).catch(e => console.log(e));
        });
    }

    function pld(proto) {
        app.get(`/proxies/p-l-d/${proto}`, (req, res) => {
            m_pld[proto]().then(pld => {
                console.log(`/p-l-d/${proto} results`, pld.data.length);
                res.contentType("text/plain");
                res.send(composeArray(pld.data));
            }).catch(e => console.log(e));
        });
    }

    function fpls() {
        app.get(`/proxies/fpls/http`, (req, res) => {
            m_fpls().then(pld => {
                console.log(`/fpls/http results`, pld.data.length);
                res.contentType("text/plain");
                res.send(composeArray(pld.data));
            }).catch(e => console.log(e));
        });
    }

    dia("http");
    dia("https");
    dia("socks5")

    spys("http");
    spys("socks5");

    pld("http");
    pld("https");
    pld("socks4");
    pld("socks5");

    hide("http");
    hide("https");
    hide("socks4");
    hide("socks5");

    fpls()
    /*
    cz("http");
    cz("https");
    cz("socks4");
    cz("socks5");
    */

    let port = process.env["PORT"] || 7769;
    app.listen(port, () => console.log(`http://localhost:${port}/`));
}
