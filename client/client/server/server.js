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
    fs = require('fs'),
    os = require('os'),
    net = require('net'),
    url = require('url'),
    crypto = require('crypto'),
    config = require('./config'),
    Keyboard = require('keyboard'),
    devices,len,i,keyboard,
    child, action,moodMonitor=false,
    interfaces = os.networkInterfaces(),
    port = 8286,
    addresses='\n',
    z,type,
    get, post,
    SESSIONID,
    headers = {};

headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = false;
headers["Access-Control-Max-Age"] = '86400'; // 24 hours
headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

// create a server that listens to localServer port
http.createServer(function(req, res){
    console.log('Called how many times?');
    var postData='', decodedBody;
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

                    var postRequest = http.request({
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
                                    res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                                    res.end('{"status":"Session set"}');
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

                    postRequest.write(postData);
                    postRequest.on('error', function(e){
                        res.writeHead(500, headers, {'Content-Type': 'text/json'});
                        res.end('{"status":"Failed to set session", "error": "'+e+'"}');
                    });
                    postRequest.end();
                } else if(decodedBody.hasOwnProperty('destroy')){
                    console.log("destroy was found from the payload");
                    SESSIONID=undefined;
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
    var parameters,
        checkSession=function(callback){

        var parse = function(chunk){
            var hash,
                payload,
                post={},
                get = url.parse(req.url,true).query || "";

            if(!SESSIONID){
                res.writeHead(401, headers,{'Content-Type':'text/json'});
                res.end('{"status":"Token is not synchronized to localhost"}');
            }

            console.log(SESSIONID);

            if(chunk === undefined && req.method === 'POST'){
                res.writeHead(401, headers,{'Content-Type':'text/json'});
                res.end('{"status":"Missing parameters."}');
            }

            payload = String(chunk);

            try{
                // try to parse in JSON format
                post = JSON.parse(payload);
            } catch(e) {
                // try to parse in normal payload format
                post = qs.parse(payload);
            }

            try {
                console.log('Parsing parameters...');
                parameters = JSON.parse((JSON.stringify(get) + JSON.stringify(post)).replace(/\}\{/, ','));

                console.log('Parameter was successfully parsed.');
                console.log(JSON.stringify(parameters));

                if(!parameters.command){
                    console.log('No command');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing command."}');
                } else if(!parameters.salt){
                    console.log('No salt');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing salt."}');
                } else if(!parameters.hash){
                    console.log('No hash');
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"status":"Missing hash."}');
                }
                try {
                    hash = crypto.createHash('sha1').update(parameters.salt+SESSIONID).digest('hex');

                    if(hash !== parameters.hash){
                        res.writeHead(401, headers,{'Content-Type':'text/json'});
                        res.end('{"status":"Token doesn\'t match."}');
                    } else if(hash === parameters.hash) {
                        console.log(SESSIONID);
                        callback();
                    }
                } catch(e) {
                    res.writeHead(400, headers, {'Content-Type':'text/json'});
                    res.end('{"Status":"Problem with sent data", "error":"'+e+'"}');
                }
            } catch(e) {
                res.writeHead(400, headers, {'Content-Type':'text/json'});
                res.end('{"Status":"Problem with sent data", "error":'+e+'}');
            }
        };

        if(req.method === 'GET'){
            console.log("GET was used. :D");
            parse();
        }

        req.on('data', parse);

    };

    if (req.method === 'OPTIONS') {
        console.log('OPTIONS');
        res.writeHead(300, headers);
        res.end();
    } else if(req.method === 'GET') {
        checkSession(function(){
            console.log('Received GET Request.');
            type = (parameters.command === 'png')? 'png' : 'jpeg';
            var dir = "/tmp/"+SESSIONID+type,
                cmd = 'python '+__dirname+"/scripts/shot.py "+dir+' '+type;
            exec(cmd, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
                if(err){
                    res.writeHead(500, headers, {'Content-Type':'text/json'});
                    res.end('{"Status":"Problem with sent data", "error":'+err+'}');
                }

                res.writeHead(200,headers, {'Content-Type' : 'image/png'});
                fs.createReadStream(dir).pipe(res);
            });
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
                        action = './scripts/disable.sh';
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
                        action = './scripts/enable.sh';
                        msg = 'Unlocking';
                        break;
                    // send the active window
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
                        if(parameters.command === ''){
                            msg = stdout.split("_NET_WM_NAME(UTF8_STRING) = ")[1];
                            var t = msg.split("WM_CLASS(STRING) = ");
                            msg = (t[1].split(",")[0] +'::'+ t[0]).replace('\n','').replace('"::"',' <:> ');
                            console.log(msg);
                        }
                        res.writeHead(200, "OK", headers,{"Content-Type": 'text/json'});
                        res.end('{"status" : "'+msg+'"}');
                    });
                } catch (e){
                    console.log(e);
                    res.writeHead(200, "OK", headers,{"Content-Type": 'text/json'});
                    res.end('{"status" : "'+msg+'"}');
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
// will tell if they are BORED, CONFUSED or OFFTASK

var timer = setTimeout(function(){
}, 20000);

var typing = function(obj){

};


exec('cat /proc/bus/input/devices | grep sysreq | awk \'{print $4}\'', function(err, stdout, stderr){
    if(!err){
        moodMonitor=true;
        devices = stdout.split("\n");

        devices.pop();
        len=devices.length;

        for(i=0;i<len;i++){
            keyboard[i] = new Keyboard(devices[i]);
            keyboard[i].on('keydown', typing);
            keyboard[i].on('keypress', typing);
            keyboard[i].on('error', console.log(devices[i], e));
        }
    } else {
        console.log(err, stderr);
        console.log('Monitor is impossible.');
    }
});

http.createServer(function(req,res){
    if (req.method === 'OPTIONS') {
      res.writeHead(300, headers);
      res.end();
    } else if(req.method === 'PUT') {

    } else {
        res.write(405,headers, {'Content-Type': 'text/json'});
        res.end('{"status":"Easter egg."}');
    }
}).listen(config.keyPort);
console.log('listening on port '+config.keyPort);
