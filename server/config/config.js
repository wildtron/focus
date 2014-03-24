var path = require('path'),
	config = {
    "mode" : "development",
    "development": {
        mode : "development",
        port : 8080,
        SALT : '59ba258bb47205f01752ea6115a1d999',
        ACCESS_TOKEN : 'cd5dc408443efd58d059eb336e904005',
        COOKIE_SECRET : 'c5a8911d55aec8f883c5a595072569b09c75eb4b',
        subjects_with_lab : {
            "CMSC 2" : "Introduction to Internet",
            "CMSC 11" : "Introduction to Computer Science",
            "CMSC 21" : "Fundamentals of Programming",
            "CMSC 22" : "Object-Oriented Programming",
            "CMSC 100" : "Web Programming",
            "CMSC 123" : "Data Structures",
            "CMSC 124" : "Design and Implementation of Programming Languages",
            "CMSC 125" : "Operating Systems",
            "CMSC 127" : "File Processing and Database Management",
            "CMSC 128" : "Introduction to Software Engineering",
            "CMSC 129" : "Compiler Design and Analysis",
            "CMSC 131" : "Introduction to Computer Organization and Machine-Level Programming",
            "CMSC 132" : "Computer Architecture",
            "CMSC 141" : "Automata and Language Theory",
            "CMSC 142" : "Design and Analysis of Algorithms",
            "CMSC 150" : "Numerical and Symbolic Computation",
            "CMSC 161" : "Interactive Computer Graphics",
            "CMSC 165" : "Digital Image Processing",
            "CMSC 170" : "Introduction to Artificial Intelligence",
            "CMSC 172" : "Robot Modelling",
            "CMSC 180" : "Introduction to Parallel Computing",
            "CMSC 191" : "Special Topics",
            "IT 1(MST)" : "Information Technology Literacy"
        },
        upload_dir : path.normalize(__dirname + '/../uploads/'),
        public_dir : path.normalize(__dirname + '/../public'),
        logs_dir : path.normalize(__dirname + '/../logs/'),
        temp_dir : path.normalize(__dirname + '/../temp'),
		upload_file_limit : '25mb',
        systemone : {
            host : 'rodolfo.uplb.edu.ph',
            port : 80,
            path: '/systemone/focus.php'
        },
        database : {
            name : 'focusdb',
            host : 'localhost',
            port : 27017
        }
    },
    "production": {
    }
}

exports.config = config[config.mode];
