#!/usr/bin/node
{

    const express = require('express'),
        path = require("path"),

       // cors = require("cors"),

        m_spys = require("../modules/spys_one"),
        m_dia = require("../modules/diatompel")
        loader = require("../core/cached-scraper");
    app = express();

    //app.use(cors());

    function composeArray(arr){
        let text = "";
        for (let idx = 0; idx < arr.length; idx++) {
            text += arr[idx] + "\n";
        }
        return text;
    }

    app.get("/f-p-l", (req,res)=>{
        const parser = require("./simple/parser-simple");
        const url = "https://free-proxy-list.net";
        loader(url, function (cb){
            parser.table(url, {selector: "div.fpl-list table tbody tr"}, cb);
        }).then(o => {
            console.log("/f-p-l results", o.data.length);
            res.contentType("text/plain");
            res.send(composeArray(o.data));
        }).catch(e => console.log(e));
    })

    app.get("/proxynova", (req,res)=>{
        const parser = require("./puppeteer/parser-puppeteer");
        const url = "https://www.proxynova.com/proxy-server-list";
        loader(url, function (cb){
            parser.table(url + "/elite-proxies/", {selector: "#tbl_proxy_list tbody tr"}, (e,d)=>{
                if (e) cb(e);
                else {
                    console.log("elite", d.length);
                    let pr = d;
                    setTimeout(function (){
                        parser.table(url + "/anonymous-proxies/", {selector: "#tbl_proxy_list tbody tr"}, (e2, d2) => {
                            if (e2) cb(e2);
                            else {
                                console.log("anonymous", d2.length);
                                cb(null,pr.concat(d2));
                            }
                        })
                    },500);
                }
            });
        }).then(o => {
            console.log("/proxynova results", o.data.length);
            res.contentType("text/plain");
            res.send(composeArray(o.data));
        }).catch(e => console.log(e));
    })

/*    app.get("/fpls", (req,res)=>{
        const parser = require("../core/puppeteer/parser-puppeteer");
        const url = "https://www.freeproxylists.net/?page=";
        loader(url, function (cb){
            parser.paged(url, {selector: "table.DataGrid", maxpage: 10 }, cb);
        }).then(o => {
            console.log("/fpls results", o.data.length);
            res.contentType("text/plain");
            res.send(composeArray(o.data));
        }).catch(e => console.log(e));
    })*/

/*    function cz(proto) {
        const parser = require("../core/puppeteer/parser-puppeteer");
        app.get(`/free-cz/${proto}`, (req, res) => {
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
        app.get(`/spys_one/${proto}`, (req, res) => {
            m_spys[proto]().then(spys => {
                console.log(`/spys_one/${proto} results`, spys.data.length);
                res.contentType("text/plain");
                res.send(composeArray(spys.data));
            }).catch(e => console.log(e));
        });
    }

    function dia(proto) {
        app.get(`/diatompel/${proto}`, (req, res) => {
            m_dia[proto]().then(dia => {
                console.log(`/diatompel/${proto} results`, dia.data.length);
                res.contentType("text/plain");
                res.send(composeArray(dia.data));
            }).catch(e => console.log(e));
        });
    }

    dia("http");
    dia("https");
    dia("socks5")

    spys("http");
    spys("socks");
/*

    cz("http");
    cz("https");
    cz("socks4");
    cz("socks5");
*/

    app.use("/",express.static(path.join(__dirname,"/www")));

    let port = process.env["PORT"] || 7769;
    app.listen(port, () => console.log(`http://localhost:${port}/`));
}
