
 {
    const { MongoClient } = require('mongodb');
    const fs = require("fs");
    const uri = "mongodb+srv://ashentouka:sl33pW4lk3r@sleepwalkerzero.kpfpk.mongodb.net/sleepwalker?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    function loadCache(url) {
        return new Promise(resolve => {
            client.connect(err => {
                let def = {
                    loaded: 0,
                    url: url,
                    data: []
                };
                client.db("sleepwalker").collection("proxylist-wrapper-webservice").findOne({ url: url }, function (err, result) {
                    if (err || !result){
                        result = def;
                    }
                    client.close();
                    resolve (result);
                });
            });
        });
    }

    function updateCache(url, listdata){
        return new Promise(resolve => {
            client.connect(err => {
                if (!err) {
                    client.db("sleepwalker").collection("proxylist-wrapper-webservice")
                        .updateOne({ url: url }, { $set: listdata }, function (err, res) {
                            if (!err) {
                                resolve();
                            } else {

                            console.log(err);
                        }
                            client.close();
                        });
                }
            });
        });
    }
module.exports = {
        loadCache,
        updateCache
}
}