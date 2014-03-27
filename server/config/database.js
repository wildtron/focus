var db,
    fs = require('fs'),
    events = require('events'),
    event = new events.EventEmitter(),
    MongoClient = require('mongodb').MongoClient,
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/../config/config').config,
	queue = [],
    imports = [],
	importData = function () {
		imports.forEach(function (collectionName) {
			var file = __dirname + '/../data/' + collectionName + '.json',
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
		db = c;
		logger.log('info', "Connected to 'focusdb' database");
		importData();
		queue.forEach(function (next) {
			next();
		});
		if (process.env['NODE_ENV'] === 'development') {
			// util.runTest();
		}
	}
);

exports.setOnConnect = function (cb) {
	(db && cb()) || queue.push(cb);
};

exports.get = function () {
    return db;
};

exports.addImport = function (collectionName) {
    imports.push(collectionName);
};

exports.saveChatHistory = function (message, instructor, student_number, from_student) {
	var save = function (err, collection) {
		if (err) return console.dir(err);
		collection.insert({
			message : message.match(/\S{1,30}/g).join(' '),
			instructor : instructor,
			student_number : student_number,
			from_student : !!from_student
		}, function (err) {
			if (err) return console.dir(err);
		});
	};
	db.collection('chat_history', save);
};

exports.getChatHistory = function (student_number, cb) {
	var getHistory = function (err, collection) {
		if (err) return console.dir(err);
		collection.find({
			student_number : student_number
		}).toArray(cb);
	};
	db.collection('chat_history', getHistory);
};
