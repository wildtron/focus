var db = require(__dirname + '/../config/database'),
    config = require(__dirname + '/../config/config').config,
    util = require(__dirname + '/../helpers/util'),
    http = require('http'),
    collectionName = 'students';

exports.collectionName = collectionName,

exports.login = function (req, res) {
    try {
        var data = util.chk_rqd(['username', 'password', 'student_number'], req.body);

        data.ip_address = req.connection.remoteAddress;

        db.get(function(db){

            db.collection(collectionName, function(err, collection) {
                collection.findOne({
                    '_id'  : data.student_number,
                    'username'  : data.username,
                    'password'  : util.hash(util.hash(data.password) + config.SALT)
                }, function (err, item) {
                    if (item) {
                        item.access_token = util.hash(+new Date + config.SALT);
                        item.last_login = +new Date;
                        collection.update({'_id' : item._id}, {$set : {
                            access_token : item.access_token,
                            last_login : +new Date,
                            ip_address : data.ip_address
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
                            var i, temp2, temp3;
                            if (temp.message) {
                                console.log("login failed", data.username, data.student_number);
                                res.send(temp);
                            }
                            else {
                                temp.username = username;
                                temp._id = student_number;
                                temp.password = util.hash(util.hash(password) + config.SALT);
                                temp.access_token = util.hash(+new Date + config.SALT);
                                temp.last_login = +new Date;
                                temp.ip_address = data.ip_address;
                                i = temp.classes.length;

                                // format classes
                                while (i--){
                                    temp3 = temp.classes[i].laboratory.split(" ");
                                    if (config.subjects_with_lab[temp.classes[i].courseCode] && temp3.length > 1) {
                                        temp.classes[i] = temp.classes[i].courseCode + " " + temp.classes[i].sectionName;
                                    }
                                    else {
                                        temp.classes.splice(i, 1);
                                    }
                                }
                                collection.remove({'_id': student_number}, {safe:true}, function (err, result) {
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

        });
    }
    catch (e) {
        res.send({message : e.message});
    }
};

exports.logout = function (req, res) {
    try{
        var data = util.chk_rqd(['access_token'], req.body);
        db.get(function(db){
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
        });
    }
    catch (e) {
        res.send({message : e.message});
    }
};


exports.findbyId = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving student: ' + id);
    db.collection(collectionName, function(err, collection) {
        collection.findOne({'_id': new BSON.ObjectID(id)}, function (err, item) {
            res.send(item);
        });
    });
};

exports.findAll = function(req, res) {
    db.get(function(db){
        db.collection(collectionName, function(err, collection) {
            collection.find().toArray(function(err, items) {
                res.send(items);
            });
        });
    });
};



function loginViaSystemOne (username, student_number, password, res, cb) {
    var payload = 'password=' + util.hash(util.hash(password) + config.SALT) +
                '&username=' +  util.hash(util.hash(username) + config.SALT) +
                '&student_number=' + util.hash(util.hash(student_number) + config.SALT) +
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

