const parser = require("../core/puppeteer/parser-puppeteer"),
loader = require("../core/cached-scraper");

module.exports = function (){
    const parser = require("../core/puppeteer/parser-puppeteer");
    const url = "https://www.proxynova.com/proxy-server-list";

    return function () {
        return loader(url, function (cb){
            parser.paged(url, {selector: "#tbl_proxy_list tbody tr", namedpages: [ "/anonymous-proxies/", "/elite-proxies/" ]}, cb);
        });
    }
}
module.exports()()