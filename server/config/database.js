var db,
    fs = require('fs'),
    events = require('events'),
    event = new events.EventEmitter(),
    MongoClient = require('mongodb').MongoClient,
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger').logger,
    config = require(__dirname + '/../config/config').config,
    imports = [],
    importData = function () {
        imports.forEach(function (collectionName) {
            var file = __dirname + './../data/' + collectionName + '.json',
                collection,
                truncateCollection = function(err, _collection){
                    if (err) throw err;
                    collection = _collection;
                    collection.remove(readFile, function (err) {
                        if (err) {
                            logger.log('warn', err.message);
                            console.dir(err);
                        }
                    });
                },
                readFile = function (err, data) {
                    if (err) throw err;
                    fs.readFile(file, 'utf8', insertData);
                },
                insertData = function (err, data) {
                    if (err) throw err;
                    data = JSON.parse(data);
                    collection.insert(data, function (err) {
                        if (err) {
                            logger.log('warn', err.message);
                            console.dir(err);
                        }
                    });
                    logger.log('info', file + ' import success');
                };

            logger.log('info', 'Importing ' + file);
            db.collection(collectionName, truncateCollection);
        });
    };

exports.listenOnConnect = function (server) {
    MongoClient.connect([
            'mongodb://',
            config.database.host,
            ':',
            config.database.port,
            '/',
            config.database.name
        ].join(''), {
            server : {
                auto_reconnect: true
            }
        }, function (err, c) {
            if (err) throw err;
            logger.log('info', "Connected to 'focusdb' database");
            db = c;
            importData();
            server.listen(config.port);
            logger.log('info', 'Server listening on port : ', config.port);
        }
    );
}

exports.get = function () {
    return db;
};

exports.addImport = function (collectionName) {
    imports.push(collectionName);
};
