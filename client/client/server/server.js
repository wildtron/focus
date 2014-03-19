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
 * */


var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    os = require('os'),
    net = require('net'),
    url = require('url'),
    crypto = require('crypto'),
    _ = require('underscore'),
    config = require('./config'),
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
    typing = function(obj){
        lastTimePress = obj.timeS;
        if(obj.keyCode === 14) {
            backspaceCount++;
        }
    },

    moodStatus='OTHER',
    keyboard=[],
    Timer = function(time, callback){
        var timer;

        this.start = function(){
            timer=setInterval(callback,time);
            console.log('Timer started');
        };

        this.stop = function(){
            clearInterval(timer);
            console.log('Timer stopped');
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
                keyboard[i].on('error', function(e){ console.log(e);});
            }
        } else {
            console.log(err, stderr);
            console.log('Monitor is impossible.');
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
        console.log(idleTime+','+backspaceCount);
        backspaceCount = 0;
        console.log('20 seconds passed');
        console.log('Mood is: '+moodStatus);
    });




/*
 * SETUP THE ENVIRONMENT
 *
 * */


headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = false;
headers["Access-Control-Max-Age"] = '86400'; // 24 hours
headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

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


// create a server that listens to localServer port
http.createServer(function(req, res){
    var postData='',postRequest, decodedBody;
    if (req.method === 'OPTIONS') {
      res.writeHead(300, headers);
      res.end();
    } else if(req.method==='POST'){
        console.log('localhost attempts to set SESSIONID');
        req.on('data', function (chunk){
            postData += chunk;
        });

        req.on('end', function() {
            console.log("Trying to set session to server");
            try{
                decodedBody = JSON.parse(postData);
                console.log("JSON parse was successful.");

                if(decodedBody.hasOwnProperty('session')){
                    console.log("session was found from the payload");
                    /*
                    *  connect to motherServer and ensure the integrity of sent SESSIONID
                    * */
                    console.log("verifying session from server");
                    var integrityCheckResult;
                    postData = qs.stringify({
                        'access_token' : decodedBody.session
                    });

                    postRequest = http.request({
                        host: config.motherHost,
                        port: config.motherPort,
                        path: '/student/findByAccessToken',
                        method: 'POST',
                        headers : {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }, function(response){
                        console.log("Received response for verification from server");
                        response.setEncoding('utf8');
                        response.on('data', function(chunk){
                            var json;
                            integrityCheckResult = chunk;
                            SESSIONID=decodedBody.session;
                            try{
                                console.log("Received data from server. Parsing...");
                                json = JSON.parse(integrityCheckResult);
                                if(json.access_token === SESSIONID){
                                    console.log("Session was found valid.");
                                    isLocked = false;
                                    masterTimer.start();
                                    if(!handle){
                                        console.log('Starting vnc.');
                                        var pass = crypto.createHash('sha1').update(SESSIONID+SESSIONID).digest('hex');
                                        console.log(pass);
                                        handle = spawn(__dirname+'/scripts/linux-app-arm', [pass, config.vncport], {
                                            env: {
                                                LD_LIBRARY_PATH: __dirname+'/lib'+process.arch.slice(-2)+'/:'+process.env.LD_LIBRARY_PATH
                                            }
                                        });
                                        console.log('Spawned it! :D');
                                        handle.stderr.on('data', function(data){
                                            console.log(data.toString());
                                            if(/^execvp\(\)/.test(data)){
                                                res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                                                res.end('{"status":"Session was set but VNC is unavailable"}');
                                            }
                                        });
                                        handle.stdout.on('data', function(data){
                                            console.log(data.toString());
                                        });
                                    }
                                    res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                                    res.end('{"status":"Session set."}');
                                } else {
                                    console.log("Session was found invalid.", json.access_token, SESSIONID);
                                    res.writeHead(401, headers, {'Content-Type' : 'text/json'});
                                    res.end('{"status":"Session was invalid."}');
                                }
                            } catch (e){
                                res.writeHead(400, headers, {'Content-Type' : 'text/json'});
                                res.end('{"status":"Failed to set session. Server did not respond accordingly", "error": "'+e+'"}');
                            }
                        });
                    });
                    console.log('Waiting for response from server');
                    postRequest.write(postData);
                    postRequest.on('error', function(e){
                        res.writeHead(500, headers, {'Content-Type': 'text/json'});
                        res.end('{"status":"Failed to set session", "error": "'+e+'"}');
                    });
                    postRequest.end();
                } else if(decodedBody.hasOwnProperty('destroy')){
                    console.log("destroy was found from the payload");
                    SESSIONID=undefined;
                    masterTimer.stop();
                    var killTimesApparmor=0, killTimesWebsock=0;
                    try{
                        handle.kill('SIGKILL');
                        handle=undefined;
                        // kill $(ps u | grep apparmor64 | grep nap | awk '{ print $2 }')
                        // kill $(ps u | grep websock | grep python | awk '{ print $2 }')
                        var apparmorkill = setTimeout(function(){
                            exec("kill $(ps aux | grep -E 'apparmor(64|32)' | grep nap | awk '{ print $2 }')",function(err,stdout,stderr){
                                console.log(err);
                                console.log(stdout);
                                console.log(stderr);
                                if(killTimesApparmor === 5) clearTimeout(apparmorkill);
                                killTimesApparmor++;
                            });
                        },5000);
                        var websockKill = setTimeout(function(){
                            exec("kill $(ps aux | grep websock | grep python | awk '{ print $2 }')",function(err,stdout,stderr){
                                console.log(err);
                                console.log(stdout);
                                console.log(stderr);
                                if(killTimesWebsock === 5) clearTimeout(websockKill);
                                killTimesWebsock++;
                            });
                        }, 5000);
                    } catch(e){
                        console.log(e);
                    }
                    res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                    res.end('{"status":"Session destroyed"}');
                } else {
                    console.log("No type was found from client request");
                    res.writeHead(404, headers, {'Content-Type' : 'text/json'});
                    res.end('{"status":"Failed to do action"}');
                }
            } catch (e) {
                console.log(e);
                res.writeHead(500, headers, {'Content-Type':'text/json'});
                res.end('{"status":"Problem with POST data"}');
                return;
            }
        });
    } else {
        res.writeHead(405, headers, {'Content-Type': 'text/json'});
        res.end('{"status": "I did not use that."}');
    }
}).listen(config.sessionPort,'localhost');
console.log('listening to port '+config.sessionPort);


/*
 * The server below controls the funtionalities of the following:
 *      Lock/Unlock
 *      Shutdown
 *      Logoff
 *
 * */

http.createServer(function (req, res) {
    var parameters=[],
        checkSession=function(callback){

        var parse = function(chunk){
            var hash,
                payload,
                post={},
                get = url.parse(req.url,true).query || "",
                key;

            if(!SESSIONID){
                res.writeHead(401, headers,{'Content-Type':'text/json'});
                res.end('{"status":"Token is not synchronized to localhost"}');
            }

            if(chunk === undefined && req.method === 'POST'){
                res.writeHead(401, headers,{'Content-Type':'text/json'});
                res.end('{"status":"Missing parameters."}');
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
            console.log(JSON.stringify(get));

            try {
                //console.log('Parsing parameters...');


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

                //console.log(JSON.stringify(parameters));

                if(!parameters.command){
                    //console.log('No command');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing command."}');
                } else if(!parameters.salt){
                    //console.log('No salt');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing salt."}');
                } else if(!parameters.hash){
                    //console.log('No hash');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing hash."}');
                }
                try {
                    hash = crypto.createHash('sha1').update(parameters.salt+SESSIONID).digest('hex');
                    if(hash !== parameters.hash){
                        res.writeHead(401, headers,{'Content-Type':'text/json'});
                        res.end('{"status":"Token doesn\'t match."}');
                    } else if(hash === parameters.hash) {
                        //console.log(SESSIONID);
                        callback();
                    }
                } catch(e) {
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"Status":"Something wicked happened inside the server", "error":"'+e+'"}');
                }
            } catch(e) {
                res.writeHead(400, headers, {'Content-Type':'text/json'});
                res.end('{"Status":"Problem with sent data", "error":"'+e+'"}');
            }
        };

        if(req.method === 'GET'){
            //console.log("GET was used. :D");
            parse();
        }

        req.on('data', parse);

    };

    if (req.method === 'OPTIONS') {
        //console.log('OPTIONS');
        res.writeHead(200, headers);
        res.end();
    } else if(req.method === 'GET') {
        checkSession(function(){
            //console.log('Received GET Request.');
            type = (parameters.command === 'png')? 'png' : 'jpeg';
            var dir = "/tmp/"+SESSIONID+type,
                cmd = 'python '+__dirname+"/scripts/shot.py "+dir+' '+type;
            try{
                exec(cmd, function (err, stdout, stderr) {
                    console.log(err);
                    console.log(stdout);
                    console.log(stderr);
                    if(err){
                        res.writeHead(500, headers, {'Content-Type':'text/json'});
                        res.end('{"Status":"Problem with sent data", "error":'+err+'}');
                    }

                    if(isLocked){
                        headers['Client-Locked'] = true;
                    } else {
                        headers['Client-Locked'] = false;
                    }
                    res.writeHead(200,headers, {'Content-Type' : 'image/png'});
                    try{
                        fs.createReadStream(dir).pipe(res);
                    } catch(e){
                        res.writeHead(500, headers, {'Content-Type':'text/json'});
                        res.end('{"Status":"Problem with image creation"}');
                    }
                });
            } catch (e){
                res.writeHead(500, headers, {'Content-Type':'text/json'});
                res.end('{"Status":"Problem with sent data", "error":"'+e+'"}');
            }
        });
    } else if(req.method === 'POST'){
        checkSession(function(){
            console.log('Received POST Request.');
            req.on('end', function () {
                var action = '',
                    msg = '';
                console.log('end-part response.');
                switch(parameters.command){
                    // shutdown
                    case 'shutdown':
                        console.log('Shutdown command initiated.');
                        action = 'shutdown -h now';
                        msg = 'Shutting down';
                        break;
                    // logoff
                    case 'logoff':
                        console.log('Logoff command initiated.');
                        action = '';
                        msg = 'Logging off';
                        break;
                    // lock
                    case 'lock':
                        console.log('System Lock On');
                        /*
                        *  turn off screen and enable screensaver
                        *  xset dpms force off
                        * */
                        action = 'sh '+__dirname+'/scripts/disable.sh';
                        msg ='Locking';
                        break;
                    // unlock
                    case 'unlock':
                        console.log('System Lock Off');
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
                         *
                         * */
                        action = 'xwininfo -root -children | grep -o \'".*":\' | awk \'!a[$0]++\' | sed \'s/"//\' | sed \'s/"://\' | sort';
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
                        exec(action, function (err, stdout, stderr) {
                        console.log(err, stdout, stderr);
                        if(err){
                            res.writeHead(500, "OK", headers,{"Content-Type": 'text/json'});
                            res.end('{"status" : "Failed doing task."}');
                        }

                        if(parameters.command === 'lock'){
                            isLocked = true;
                        } else if(parameters.command === 'unlock'){
                            isLocked = false;
                        }

                        if(parameters.command === ''){
                            msg = stdout.split("_NET_WM_NAME(UTF8_STRING) = ")[1];
                            var t = msg.split("WM_CLASS(STRING) = ");
                            msg = (t[1].split(",")[0] +'::'+ t[0]).replace('\n','').replace('"::"',' <:> ');
                        } else if(parameters.command === 'proclist'){
                            var out = stdout.split('\n');
                            headers['Content-Type'] = 'text/json';
                            res.writeHead(200, "OK", headers);
                            res.end(JSON.stringify({status: out}));
                        }

                        res.writeHead(200, "OK", headers,{"Content-Type": 'text/json'});
                        res.end('{"status" : "'+msg+'"}');
                        });

                } catch (e){
                    console.log(e);
                    res.writeHead(200, "OK", headers,{"Content-Type": 'text/json'});
                    res.end('{"status" : "Something wicked happened."}');
                }
                // CATCH-end

            });
       });
    } else {
       checkSession(function(){
            res.writeHead(404, "Not Found", headers ,{"Content-Type": 'text/json'});
            res.end('{"status" : "task unavailable"}');
       });
    }
}).listen(config.activityPort);
console.log("listening on port "+config.activityPort);


// this server is for the typed keys of the user
// this will not logged the user's keys but instead
// will tell if they are BORED, CONFUSED ,OFFTASK on ONTASK


http.createServer(function(req,res){
    if (req.method === 'OPTIONS') {
      res.writeHead(300, headers);
      res.end();
    } else if(req.method === 'PUT') {
        res.writeHead(200, "OK", headers,{'Content-Type': 'text/json'});
        res.end('{"status": "'+String(moodStatus)+'"}');
    } else {
        res.writeHead(405,headers, {'Content-Type': 'text/json'});
        res.end('{"status":"Easter egg."}');
    }
}).listen(config.keyPort);
console.log('listening on port '+config.keyPort);

