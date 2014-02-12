var mongo = require('mongodb'),
    util = require('./util'),
    Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure,
    server = new Server('localhost', 27017, {auto_reconnect: true}),
    db = new Db('focusdb', server),
    collectionName = 'instructors';
 
db.open(function(err, db) {
    if (!err) {
        console.log("Instructor connected to 'focusdb' database");
        db.collection(collectionName, {strict : true}, function (err, collection) {
            if (err) {
                console.log("The '" + collectionName + "' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
    else {
        console.dir(err);
        throw err;
    }
});


exports.login = function (req, res) {
    try {
        var data = util.chk_rqd(['username', 'password'], req);
        
        db.collection(collectionName, function(err, collection) {
            collection.findOne({
                'username'  : data.username,
                'password'  : data.password
            }, function (err, item) {
                if (item == null) {
                    res.send({message : 'Wrong username or password'});
                }
                else {
                    // using server date, get the class happening right now
                    var date = new Date(),
                        hour = date.getHours(),
                        day = "UMTWHFS"[date.getDay()],
                        i = item.classes.length,
                        temp;

                    // iterate through instructor's classes
                    while(i--) {
                        temp = item.classes[i].time.split("-");
                        if (item.classes[i].day.split("-")[0] === day && hour >= +temp[0] && hour < +temp[1]) {
                            
                        }
                    }
                    
                    res.send(item);
                    
                }
            });
        });
    } catch (e) {
        console.dir(e);
        res.send({message : e.message});
    }
};
 
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving instructor: ' + id);
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
 
exports.addinstructor = function(req, res) {
    var instructor = req.body;
    console.log('Adding instructor: ' + JSON.stringify(instructor));
    db.collection(collectionName, function(err, collection) {
        collection.insert(instructor, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}
 
exports.updateinstructor = function(req, res) {
    var id = req.params.id,
        instructor = req.body;
    console.log('Updating instructor: ' + id);
    console.log(JSON.stringify(instructor));
    db.collection(collectionName, function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, instructor, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating instructor: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(instructor);
            }
        });
    });
}
 
exports.deleteinstructor = function(req, res) {
    var id = req.params.id;
    console.log('Deleting instructor: ' + id);
    db.collection(collectionName, function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}




var populateDB = function() {

    var instructors = [
        {
            first_name: "Katrina Joy",
            middle_name : "H",
            last_name : "Magno",
            username : "mamkat",
            password : "12345",
            employee_id : "123456789",
            classes : [
                {
                    course_name : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course_name : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        }
    ];
 
    db.collection(collectionName, function(err, collection) {
        collection.insert(instructors, {safe : true}, function(err, result) {});
    });
 
};