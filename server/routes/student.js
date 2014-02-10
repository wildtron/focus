var mongo = require('mongodb'),
    util = require('./util'),
    Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure,
    server = new Server('localhost', 27017, {auto_reconnect: true}),
    db = new Db('focusdb', server),
    collectionName = 'students';
 
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
                'student_number'  : data.username,
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
 
exports.addstudent = function(req, res) {
    var student = req.body;
    console.log('Adding student: ' + JSON.stringify(student));
    db.collection(collectionName, function(err, collection) {
        collection.insert(student, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}
 
exports.updatestudent = function(req, res) {
    var id = req.params.id,
        student = req.body;
    console.log('Updating student: ' + id);
    console.log(JSON.stringify(student));
    db.collection(collectionName, function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, student, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating student: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(student);
            }
        });
    });
}
 
exports.deletestudent = function(req, res) {
    var id = req.params.id;
    console.log('Deleting student: ' + id);
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

    var students = [
        {
            first_name: "Raven John",
            middle_name : "Martinez",
            last_name : "Lagrimas",
            student_number : "2010-43168",
            password : '12345',
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        },
        {
            first_name: "Sherwin Jet",
            middle_name : "Bilog",
            last_name : "Ferrer",
            student_number : "2010-41794",
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        },
        {
            first_name: "Sharmaine",
            middle_name : "D",
            last_name : "Tablada",
            student_number : "2010-04510",
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        },
        {
            first_name: "Ray Cedric Louis",
            middle_name : "H",
            last_name : "Abuso",
            student_number : "2010-04916",
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        },
        {
            first_name: "Reuel Carlo",
            middle_name : "P",
            last_name : "Virtucio",
            student_number : "2010-19864",
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        },
        {
            first_name: "Jude Allen",
            middle_name : "B",
            last_name : "Mailom",
            student_number : "2010-42985",
            classes : [
                {
                    course : 'CMSC 125',
                    section_name : 'ST-9L',
                    day : 'M',
                    time : '1-4'
                },
                {
                    course : 'CMSC 170',
                    section_name : 'U-7L',
                    day : 'F',
                    time : '4-7'
                }
            ]
        }
    ];
 
    db.collection(collectionName, function(err, collection) {
        collection.insert(students, {safe : true}, function(err, result) {
            console.dir(err);
        });
    });
 
};