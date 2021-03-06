#!/usr/bin/env node
/* best run when root
 *
 * node server to receive command from instructor server
 *  for shutdown
 *      logoff
 *      lock
 * */
/*
 * Usage is found in README outside the local server directory
 *
 *
 * */

console.log("STARTING SCRIPT");
var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    os = require('os'),
    net = require('net'),
    url = require('url'),
    crypto = require('crypto'),
    util = require('util'),
    formidable = require('formidable'),
    config = require('./config'),
    masterConfig = {
        server : config.motherHost,
        port : config.motherPort,
        env : config.env
    },
    Keyboard = require('keyboard'),
    devices,len,i,keyboard,
    child, action,moodMonitor=false,
    handle,
    interfaces = os.networkInterfaces(),
    addresses='\n',
    z,type,
    get, post,
    SESSIONID, isLocked = false,
    headers = {},
    backspaceCount=0,idleTime=0,
    lastTimePress= ((+new Date())/1000).toFixed(0),
    moodStatus='OTHER',
    typing = function(obj){
        lastTimePress = obj.timeS;
        if(obj.keyCode === 14) {
            backspaceCount++;
        }
    },
    keyboard=[],
    Timer = function(time, callback){
        var timer;

        this.start = function(){
            timer=setInterval(callback,time);
            log('Timer started');
        };

        this.stop = function(){
            clearInterval(timer);
            log('Timer stopped');
        };

        this.restart = function(){
            clearInterval(timer);
            this.start();
        };
    },

    logBin = exec('cat /proc/bus/input/devices | grep sysrq | awk \'{print $4}\'', function(err, stdout, stderr){
        if(!err){
            moodMonitor=true;
            devices = stdout.split("\n");

            devices.pop();
            len=devices.length;

            for(i=0;i<len;i++){
                keyboard[i] = new Keyboard(devices[i]);
                keyboard[i].on('keydown', typing);
                keyboard[i].on('keypress', typing);
                keyboard[i].on('error', function(e){
                });
            }
            log('binded to keyboard');
        } else {
            log(err, stderr);
            log('Monitor is impossible.');
        }
    }), masterTimer = new Timer(20000, function(){
        idleTime = ((+new Date())/1000).toFixed(0) - lastTimePress;

        /*
         *  This evaluation is base from
         *  The Development and Implementation of an Intelligent
         *  Agent that Detects Student’s Negative Affect while Making
         *  a Computer Program
         *
         * of
         *
         * Larry A. Vea, Miguel Ramon D. Medina, Regine P. Toriaga and Nicole Joseph D. Padla
         *
         * from School Of Information Technology, Mapua Institute of Technology
         *
         * */
        if(idleTime >= 20 && backspaceCount === 0){
            moodStatus = 'BORED';
        } else if ((backspaceCount > idleTime && (idleTime > 11 && backspaceCount === 0)) || (idleTime > 9 && backspaceCount === 0)) {
            moodStatus = 'CONFUSED';
        } else if ((backspaceCount < idleTime) || ((idleTime <= 11) && (backspaceCount === 0))) {
            moodStatus = 'OTHER';
        }
        log(idleTime+','+backspaceCount+','+moodStatus);
        backspaceCount = 0;
        log('20 seconds passed');
        log('Mood is: '+moodStatus);
    }),
    log = function(){
        var z=0, len = arguments.length;

        if(masterConfig.env === 'development'){
            for(z=0;z<len;z++){
                console.log(arguments[z]);
            }
        }
    },
    configOverload = {
        host: 'ricolindo.uplb.edu.ph',
        port: 8080,
        path: '/config.json',
        method: 'GET'
    },
    overloadSettings = http.request(configOverload, function(res){
        res.on('data', function(data){
            log('Setting new parameters');
            var p = JSON.parse(data);
            log(p);
            masterConfig.server = p.server;
            masterConfig.port = p.port;
            masterConfig.env = p.env;
            main();
        });

        res.on('error', function(e){
            log(e);
            log('Using default values for port, server and environment');
            main();
        });
    }),
    activityServer,
    sessionServer,
    keyServer
    ;


overloadSettings.on('error', function(e){
    log("Using default settings to access main server.");
    main();
});

overloadSettings.end();

/*
 * SETUP THE ENVIRONMENT
 *
 * */

headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = false;
headers["Access-Control-Max-Age"] = '86400'; // 24 hours
headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Client-Locked";
headers["Access-Control-Expose-Headers"] = "X-Client-Locked";
headers['Content-Type'] = 'text/json'

fs.chmodSync(__dirname+'/scripts/disable.sh', 0555);
fs.chmodSync(__dirname+'/scripts/keyboard.sh',0555);
fs.chmodSync(__dirname+'/scripts/enable.sh',0555);
fs.chmodSync(__dirname+'/scripts/linux-app-arm',0555);
fs.chmodSync(__dirname+'/scripts/mouse.sh',0555);
fs.chmodSync(__dirname+'/scripts/shot.py',0555);
if(process.arch.slice(-2) === '64'){
    fs.chmodSync(__dirname+'/apparmor/bin/apparmor64', 0555);
}
else {
    fs.chmodSync(__dirname+'/apparmor/bin/apparmor32', 0555);
}
fs.chmodSync(__dirname+'/client/utils/websockify', 0555);
fs.chmodSync(__dirname+'/client/utils/web.py', 0555);
fs.chmodSync(__dirname+'/client/utils/u2x11', 0555);
fs.chmodSync(__dirname+'/client/utils/rebind', 0555);
fs.chmodSync(__dirname+'/client/utils/nova-novncproxy', 0555);
fs.chmodSync(__dirname+'/client/utils/json2graph.py', 0555);
fs.chmodSync(__dirname+'/client/utils/img2js.py', 0555);

var main = function(){
    console.log(masterConfig);
    // create a server that listens to localServer port

    sessionServer = http.createServer(function(req, res){
        var postData='',postRequest, decodedBody;
        if (req.method === 'OPTIONS') {
        res.writeHead(300, headers);
        res.end();
        } else if(req.method==='POST'){
            log('localhost attempts to set SESSIONID');
            req.on('data', function (chunk){
                postData += chunk;
            });

            req.on('end', function() {
                log("Trying to set session to server");
                try{
                    decodedBody = JSON.parse(postData);
                    log("JSON parse was successful.");

                    if(decodedBody.hasOwnProperty('session')){
                        log("session was found from the payload");
                        /*
                        *  connect to motherServer and ensure the integrity of sent SESSIONID
                        * */
                        log("verifying session from server");
                        var integrityCheckResult;
                        postData = qs.stringify({
                            'access_token' : decodedBody.session
                        });

                        postRequest = http.request({
                            host: masterConfig.server,
                            port: masterConfig.port,
                            path: '/student/findByAccessToken',
                            method: 'POST',
                            headers : {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }, function(response){
                            log("Received response for verification from server");
                            response.setEncoding('utf8');
                            response.on('data', function(chunk){
                                var json;
                                integrityCheckResult = chunk;
                                SESSIONID=decodedBody.session;
                                try{
                                    log("Received data from server. Parsing...");
                                    json = JSON.parse(integrityCheckResult);
                                    if(json.access_token === SESSIONID){
                                        log("Session was found valid.");
                                        isLocked = false;
                                        masterTimer.start();
                                        if(!handle){
                                            log('Starting vnc.');
                                            var pass = crypto.createHash('sha1').update(SESSIONID+SESSIONID).digest('hex');
                                            log(pass);
                                            handle = spawn(__dirname+'/scripts/linux-app-arm', [pass, config.vncport], {
                                                env: {
                                                    LD_LIBRARY_PATH: __dirname+'/lib'+process.arch.slice(-2)+'/:'+process.env.LD_LIBRARY_PATH,
                                                DISPLAY:':0.0'
                                                }
                                            });
                                            log('Spawned it! :D');
                                            handle.stderr.on('data', function(data){
                                                log(data.toString());
                                                if(/^execvp\(\)/.test(data)){
                                                    var _response = {
                                                        status : "Session was set but VNC is unavailable"
                                                    };

                                                    res.writeHead(200, headers);
                                                    res.end(JSON.stringify(_response));
                                                }
                                            });
                                            handle.stdout.on('data', function(data){
                                                log(data.toString());
                                            });
                                        }
                                        res.writeHead(200, headers);
                                        var _response = {
                                            status : "Session set."
                                        };

                                        res.end(JSON.stringify(_response));
                                    } else {
                                        log("Session was found invalid.", json.access_token, SESSIONID);
                                        var _response = {
                                            status : "Session was invalid."
                                        };

                                        res.writeHead(401, headers);
                                        res.end(JSON.stringify(_response));
                                    }
                                } catch (e){
                                    var _response = {
                                        status : "Failed to set session. Server did no respond accordingly",
                                        error : e
                                    };

                                    res.writeHead(400, headers);
                                    res.end(JSON.stringify(_response));
                                }
                            });
                        });
                        log('Waiting for response from server');
                        postRequest.write(postData);
                        postRequest.on('error', function(e){
                            var _response = {
                                status : "Failed to set session",
                                error : e
                            };

                            res.writeHead(500, headers);
                            res.end(JSON.stringify(_response));
                        });

                        postRequest.end();
                    } else if(decodedBody.hasOwnProperty('destroy')){
                        var killTimesApparmor=0, killTimesWebsock=0;

                        log("destroy was found from the payload");
                        SESSIONID=undefined;
                        masterTimer.stop();

                        try{
                            handle.kill('SIGKILL');
                            handle=undefined;

                            var apparmorkill = setTimeout(function(){
                                exec("kill $(ps aux | grep -E 'apparmor(64|32)' | grep nap | awk '{ print $2 }')",function(err,stdout,stderr){
                                    log(err);
                                    log(stdout);
                                    log(stderr);
                                    if(killTimesApparmor === 5) clearTimeout(apparmorkill);
                                    killTimesApparmor++;
                                });
                            },5000);

                            var websockKill = setTimeout(function(){
                                exec("kill $(ps aux | grep websock | grep python | awk '{ print $2 }')",function(err,stdout,stderr){
                                    log(err);
                                    log(stdout);
                                    log(stderr);
                                    if(killTimesWebsock === 5) clearTimeout(websockKill);
                                    killTimesWebsock++;
                                });
                            }, 5000);

                        } catch(e){
                            log(e);
                        }

                        var _response = {
                            status : "Session destroyed"
                        };

                        res.writeHead(200, headers);
                        res.end(JSON.stringify(_response));
                    } else {
                        var _response = {
                            status : "Faled to do action"
                        };

                        log("No type was found from client request");

                        res.writeHead(404, headers);
                        res.end(JSON.stringify(_response));
                    }
                } catch (e) {
                    var _response = {
                        status : "Problem with POST data"
                    };

                    log(e);

                    res.writeHead(500, headers);
                    res.end(JSON.stringify(_response));
                    return;
                }
            });
        } else {
            var _response = {
                status : "I did not use that."
            };

            res.writeHead(405, headers);
            res.end(JSON.stringify(_response));
        }
    }).listen(config.sessionPort,'localhost');
    log('listening to port '+config.sessionPort);


    /*
    * The server below controls the funtionalities of the following:
    *      Lock/Unlock
    *      Shutdown
    *      Logoff
    *      Proclist
    * */

    activityServer = http.createServer(function (req, res) {
        var parameters=[],
            checkSession=function(callback){

            var parse = function(chunk){
                var hash,
                    payload,
                    post={},
                    get = url.parse(req.url,true).query || "",
                    key;

                if(!SESSIONID){
                    var _response = {
                        status : "Token is not synchronized to localhost"
                    };

                    res.writeHead(401, headers);
                    res.end(JSON.stringify(_response));
                }

                if(chunk === undefined && req.method === 'POST'){
                    var _response = {
                        status : "Missing parameters"
                    };

                    res.writeHead(401, headers);
                    res.end(JSON.stringify(_response));
                }

                payload = String(chunk);

                if(chunk !== undefined){
                    try{
                        // try to parse in JSON format
                        post = JSON.parse(payload);
                    } catch(e) {
                        // try to parse in normal payload format
                        post = qs.parse(payload);
                    }
                }

                log(JSON.stringify(get));

                try {
                    log('Parsing parameters...');

                    if(get !== ""){
                        for(key in get){
                            parameters[key] = get[key];
                        }
                    }

                    if(post !== undefined){
                        for(key in post){
                            parameters[key] = post[key];
                        }
                    }

                    log(JSON.stringify(parameters));

                    if(!parameters.command){
                        var _response = {
                            status : "Missing command."
                        };

                        log('No command');

                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    } else if(!parameters.salt){
                        var _response = {
                            status : "Missing salt."
                        };

                        log('No salt');

                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    } else if(!parameters.hash){
                        var _response = {
                            status : "Missing hash"
                        };

                        log('No hash');

                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    }
                    try {
                        hash = crypto.createHash('sha1').update(parameters.salt+SESSIONID).digest('hex');

                        if(hash !== parameters.hash){
                            var _response = {
                                status : "Token doesn't match."
                            };

                            res.writeHead(401, headers);
                            res.end(JSON.stringify(_response));
                        } else if(hash === parameters.hash) {
                            log(SESSIONID);
                            callback();
                        }
                    } catch(e) {
                        var _response = {
                            status : "Something wicked happened inside the server",
                            error : e
                        };

                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    }
                } catch(e) {
                    var _response = {
                        status : "Problem with sent data",
                        error : e
                    };

                    res.writeHead(400, headers);
                    res.end(JSON.stringify(_response));
                }
            };

            if(req.method === 'GET'){
                log("GET was used. :D");
                parse();
            }

            req.on('data', parse);

        };

        if (req.method === 'OPTIONS') {
            log('OPTIONS');

            res.writeHead(200, headers);
            res.end();
        } else if(req.method === 'GET') {
            checkSession(function(){
                log('Received GET Request.');
                type = (parameters.command === 'png')? 'png' : 'jpeg';

                var dir = "/tmp/"+SESSIONID+type,
                    cmd = 'python '+__dirname+"/scripts/shot.py "+dir+' '+type;

                try{
                    exec(cmd, function (err, stdout, stderr) {
                        log(err);
                        log(stdout);
                        log(stderr);

                        if(err){
                            var _response = {
                                status : "Problem with sent data",
                                error : err
                            };

                            res.writeHead(500, headers);
                            res.end(JSON.stringify(_response));
                        }

                        if(isLocked){
                            headers['X-Client-Locked'] = true;
                        } else {
                            headers['X-Client-Locked'] = false;
                        }

                        try{
                            headers['Content-Type'] = 'image/png'
                            res.writeHead(200,headers);
                            fs.createReadStream(dir).pipe(res);

                        } catch(e){
                            var _response = {
                                status : "Problem with image creation"
                            };

                            res.writeHead(500, headers);
                            res.end(JSON.stringify(_response));
                        }

                    });
                } catch (e){
                    var _response = {
                        status : "Problem with sent data",
                        error : e
                    };

                    res.writeHead(500, headers);
                    res.end(JSON.stringify(_response));
                }
            });
        } else if(req.method === 'POST'){
            checkSession(function(){
                log('Received POST Request.');
                req.on('end', function () {
                    var action = '',
                        msg = '';
                    log('end-part response.');

                    var path = url.parse(req.url).pathname;

                    log(path);
                    switch(parameters.command){
                        // shutdown
                        case 'shutdown':
                            log('Shutdown command initiated.');
                            action = 'shutdown -h now';
                            msg = 'Shutting down';
                            break;
                        // logoff
                        case 'logoff':
                            log('Logoff command initiated.');
                            action = 'pkill -KILL -u `who | grep -v root | awk \'{print $1}\' | uniq`';
                            msg = 'Logging off';
                            break;
                        // lock
                        case 'lock':
                            log('System Lock On');
                            /*
                            *  turn off screen and enable screensaver
                            *  xset dpms force off
                            * */
                            action = __dirname+'/scripts/disable.sh';
                            msg ='Locking';
                            break;
                        // unlock
                        case 'unlock':
                            log('System Lock Off');
                            /*
                            * turn on screen and disable screensaver
                            * xset dpms force on
                            * xset s reset
                            * killall gnome-screensaver
                            *
                            * */
                            action = 'sh '+__dirname+'/scripts/enable.sh';
                            msg = 'Unlocking';
                            break;
                        // send the active window
                        case 'proclist':
                            /*
                            * this sends all processes with window
                            * */

                            /*
                            * gets all process that has a window
                            * */
                            action = 'xwininfo -root -children | grep -o \'".*":\' | awk \'!a[$0]++\' | sed \'s/"//\' | sed \'s/"://\' | sort';

                            /*
                                * gets all process regardless if they are have window or not
                                */
                            //action = 'ps axo user,command';
                            msg = 'Process List';
                            break;
                        default:
                            action ="xprop -id $(xprop -root 32x '\t$0' _NET_ACTIVE_WINDOW | cut -f 2) _NET_WM_NAME WM_CLASS";
                            parameters.command='';
                            msg='ActiveWindow';
                            break;
                    }

                    // TRY
                    try {

                        if(parameters.command === 'lock'){
                            isLocked = true;
                        } else if(parameters.command === 'unlock'){
                            isLocked = false;
                        }

                        if(parameters.command === 'lock'){
                            log(action);

                            var child = spawn(action,[], {}, function(){
                                var _response = {
                                    status : msg
                                };

                                res.writeHead(200, headers);
                                res.end(JSON.stringify(_response));
                            });

                            child.stderr.on('data', function(data){
                                log(data.toString());
                                if(/^execvp\(\)/.test(data)){
                                    var _response = {
                                        status : "Session was set but VNC is unavailable"
                                    };

                                    res.writeHead(200, headers);
                                    res.end(JSON.stringify(_response));
                                }
                            });

                            child.stdout.on('data', function(data){
                                log(data.toString());
                            });

                            var _response = {
                                status : msg
                            };

                            res.writeHead(200, headers);
                            res.end(JSON.stringify(_response));
                        } else {
                            exec(action, function (err, stdout, stderr) {
                                log(err);
                                log(stdout);
                                log(stderr);

                                if(err){
                                    var _response = {
                                        status : "Something went wrong.",
                                        error : err
                                    };

                                    res.writeHead(500, headers);
                                    res.end(JSON.stringify(_response));
                                }

                                if(parameters.command === ''){
                                    msg = stdout.split("_NET_WM_NAME(UTF8_STRING) = ")[1];
                                    var t = msg.split("WM_CLASS(STRING) = ");
                                    msg = (t[1].split(",")[0] +'::'+ t[0]).replace('\n','').replace('"::"',' <:> ');
                                } else if(parameters.command === 'proclist'){
                                    var out = stdout.split('\n');

                                    res.writeHead(200, headers);
                                    res.end(JSON.stringify({status: out}));
                                }

                                var _response = {
                                    status : msg
                                };

                                res.writeHead(200, headers);
                                res.end(JSON.stringify(_response));
                            });
                        }
                    } catch (e){
                        log(e);

                        var _response = {
                            status : "Something wicked happened"
                        };

                        res.writeHead(200, headers);
                        res.end(JSON.stringify(_response));
                    }
                    // CATCH-end
                });
            });
        } else {
            checkSession(function(){
                    var _response = {
                        status : "task unavailable"
                    };

                    res.writeHead(404, headers);
                    res.end(JSON.stringify(_response));
            });
        }
    }).listen(config.activityPort);
    log("listening on port "+config.activityPort);

    // this server is for the typed keys of the user
    // this will not logged the user's keys but instead
    // will tell if they are BORED, CONFUSED , (OFFTASK on ONTASK)

    keyServer = http.createServer(function(req,res){
        if (req.method === 'OPTIONS') {
            res.writeHead(300, headers);
            res.end();
        } else if(req.method === 'POST'){
            if(url.parse(req.url).pathname === '/upload'){
               if(!SESSIONID) {
                    log("No session on server.");
                    var _response = {
                        status : "No session on client."
                    };

                    res.writeHead(401, headers);
                    res.end(JSON.stringify(_response));
                }
                var form = new formidable.IncomingForm();

                form.parse(req, function(err, fields, files){
                    if(err || (files.file === undefined)){
                        log("Missing file or "+err);
                        var _response = {
                            status: 'missing file field'
                        };
                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));

                    } else if(fields.command===undefined) {
                        var _response = {
                            status: 'missing command field'
                        };
                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    } else if(fields.hash === undefined) {
                        var _response = {
                            status: 'missing hash field'
                        };
                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    } else if(fields.salt === undefined) {
                        var _response = {
                            status: 'missing salt field'
                        };
                        res.writeHead(400, headers);
                        res.end(JSON.stringify(_response));
                    } else {
                        var hash = crypto.createHash('sha1').update(fields.salt+SESSIONID).digest('hex');
                        if(hash != fields.hash) {
                            var _response = {
                                status : "Token doesn't match."
                            };

                            res.writeHead(401, headers);
                            res.end(JSON.stringify(_response));
                        }

                        var _response = {
                            status : 'Received file.'
                        };

                        var src = fs.createReadStream(files.file.path);
                        var dest = fs.createWriteStream(process.env.HOME+'/Desktop/'+files.file.name);

                        src.pipe(dest);

                        src.on('end', function(){
                            res.writeHead(200, headers);
                            res.end(JSON.stringify(_response));
                        });

                        src.on('error', function(err){
                            _response.error = err;

                            res.writeHead(500, headers);
                            res.end(JSON.stringify(_response));
                        });
                    }
                });

                log('Passed parsing process.');
            }
        } else if(req.method === 'PUT') {
            var _response = {
                status : moodStatus
            };

            res.writeHead(200, headers);
            res.end(JSON.stringify(_response));
        } else {
            var _response = {
                status : "Easter egg"
            };

            res.writeHead(405,headers);
            res.end(JSON.stringify(_response));
        }
    }).listen(config.keyPort);
    log('listening on port '+config.keyPort);


    // server catches
    activityServer.on('error', function(e){
        log(e)
    });

    sessionServer.on('error', function(e){
        log(e)
    });

    keyServer.on('error', function(e){
        log(e)
    });
};


