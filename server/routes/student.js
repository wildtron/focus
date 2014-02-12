var mongo = require('mongodb'),
    crypto = require('crypto'),
    http = require('http'),
    util = require('./util'),
    config = require(__dirname + '/../config/config'),
    
    Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure,
    db = new Db('focusdb', new Server('localhost', 27017, {auto_reconnect: true})),
    collectionName = 'students',
    hash = function (string) {
        return crypto.createHash('md5').update(string).digest('hex');
    };

db.open(function(err, db) {
    err && console.log("Student cant connect to database", err);
});

exports.login = function (req, res) {
    try {
        var data = util.chk_rqd(['username', 'password', 'student_number'], req);

        db.collection(collectionName, function(err, collection) {
            collection.findOne({
                'username'  : data.username,
                'student_number'  : data.student_number,
                'password'  : hash(hash(data.password) + config.SALT)
            }, function (err, item) {
                if (item) {
                    item.access_token = hash(+new Date + config.SALT);
                    item.last_login = +new Date;
                    collection.update({'_id' : item._id}, {$set : {
                        access_token : item.access_token,
                        last_login : +new Date
                    }}, {safe:true}, function (err, result) {
                        err && console.log(err);
                    });
                    res.send({
                        access_token : item.access_token,
                        first_name : item.first_name,
                        last_name : item.last_name
                    });
                    console.log("logged in locally", data.username, data.student_number);
                }
                else {
                    loginViaSystemOne(data.username, data.student_number, data.password, res, function (temp, username, student_number, password, res) {
                        if (temp.message) {
                            console.log("login failed", data.username, data.student_number);
                            res.send(temp);
                        }
                        else {
                            temp.username = username;
                            temp.student_number = student_number;
                            temp.password = hash(hash(password) + config.SALT);
                            temp.access_token = hash(+new Date + config.SALT);
                            temp.last_login = +new Date;
                            collection.remove({'student_number': student_number}, {safe:true}, function (err, result) {
                                err && console.log(err);
                            });
                            collection.insert(temp, {safe:true}, function (err, result) {                                
                                err && console.log(err);
                            });
                            res.send({
                                access_token : temp.access_token,
                                first_name : temp.first_name,
                                last_name : temp.last_name
                            });
                            console.log("logged in via systemone", data.username, data.student_number);
                        }
                    });
                }
            });
        });
    }
    catch (e) {
        res.send({message : e.message});
    }
};

exports.logout = function (req, res) {
    try{
        var data = util.chk_rqd(['access_token'], req);
        db.collection(collectionName, function(err, collection) {
            collection.findOne({'access_token': data.access_token}, function (err, item) {
                if (err) {
                    res.send({message : "Invalid access_token"});
                }
                else {
                    collection.update({'_id' : item._id}, {$set : {access_token: null, socket_id : null}}, {safe: true}, function (err, result) {
                        err && console.log(err);
                    });
                    res.send({message : "Logout successful"});
                    console.log("Logout successful");
                }
            });
        });
    }
    catch (e) {
        res.send({message : e.message});
    }
};

exports.setSocket = function (access_token, id) {
    db.collection(collectionName, function(err, collection) {
        collection.update({'access_token' : access_token}, {$set : {socket_id: id}}, {safe: true}, function (err, result) {
            err && console.log(err);
        });
    });
};

exports.validateSocket = function (access_token, id, cb) {
    db.collection(collectionName, function(err, collection) {
        collection.findOne({
            'access_token' : access_token,
            'socket_id' : id
        }, cb);
    });
};
 
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving student: ' + id);
    db.collection(collectionName, function(err, collection) {
        collection.findOne({'_id': new BSON.ObjectID(id)}, function (err, item) {
            res.send(item);
        });
    });
};
 
exports.findAll = function(req, res) {
    db.collection(collectionName, function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};



function loginViaSystemOne (username, student_number, password, res, cb) {
    var payload = 'password=' + hash(hash(password) + config.SALT) +
                '&username=' +  hash(hash(username) + config.SALT) +
                '&student_number=' + hash(hash(student_number) + config.SALT) +
                '&access_token=' + config.ACCESS_TOKEN,
        req = http.request({
            host: 'rodolfo.uplb.edu.ph',
            port: 80,
            path: '/systemone/focus.php',
            method: 'POST',
            headers : {
                "Content-Type" : 'application/x-www-form-urlencoded',
                "Content-Length" : payload.length
            }
        }, function(response) {
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                cb(JSON.parse(chunk), username, student_number, password, res);
            });
        });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(payload);
    req.end();
}