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
        console.log("Connected to 'focusdb' database");
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


/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
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
                    section_name : 'ST-9L'
                },
                {
                    course_name : 'CMSC 170',
                    section_name : 'U-7L'
                }
            ]
        }
    ];
 
    db.collection(collectionName, function(err, collection) {
        collection.insert(instructors, {safe : true}, function(err, result) {});
    });
 
};