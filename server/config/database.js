var fs = require('fs'),
    events = require('events'),
    event = new events.EventEmitter(),
    mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    server = new Server('localhost', 27017, {auto_reconnect: true}),
    db = new Db('focusdb', server, {safe : true}),
    client;

db.open(function(err, c) {
    if (err)
        throw err;
    client = c;
    event.emit('connect');
    console.log("Connected to 'focusdb' database");
});

exports.get = function(cb) {
    if (client) {
        cb(client);
    } else {
        event.on('connect', function () {
            cb(client);
        });
    }
};

exports.importData = function (collectionName) {
    var file = __dirname + './../data/' + collectionName + '.json'

    exports.get(function(db) {
        console.log('Importing ' + file);
        db.collection(collectionName, function(err, collection){
            collection.remove(function (err, data) {
                fs.readFile(file, 'utf8', function (err, data) {
                    if (err)
                        throw err;

                    data = JSON.parse(data);

                    collection.insert(data, {safe : true}, function(err, result) {
                        if (err)
                            throw err;
                        console.log(collectionName + ' import success');
                    });
                });        
            });
        });
    });
};
