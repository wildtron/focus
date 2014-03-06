var fs = require('fs'),
    events = require('events'),
    event = new events.EventEmitter(),
    mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger').logger,
    config = require(__dirname + '/../config/config').config,
    server = new Server(config.database.host, config.database.port, {auto_reconnect: true}),
    db = new Db(config.database.name, server, {safe : true}),
    client;

db.open(function (err, c) {
    if (err) throw err;
    client = c;
    event.emit('connect');
    logger.log('info', "Connected to 'focusdb' database");
});

exports.get = function (cb) {
    if (client) cb(client);
    else {
        event.on('connect', function () {
            cb(client);
        });
    }
};

exports.importData = function (collectionName) {
    var file = __dirname + './../data/' + collectionName + '.json',
        collection,
        getCollection = function (db) {
            db.collection(collectionName, truncateCollection);
        },
        truncateCollection = function(err, _collection){
            if (err) throw err;
            collection = _collection;
            collection.remove(readFile);
        },
        readFile = function (err, data) {
            if (err) throw err;
            fs.readFile(file, 'utf8', insertData);
        },
        insertData = function (err, data) {
            if (err) throw err;
            data = JSON.parse(data);
            collection.insert(data, util.throw_err);
            logger.log('info', file + ' import success');
        };

    logger.log('info', 'Importing ' + file);
    exports.get(getCollection);
};
