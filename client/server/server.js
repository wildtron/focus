#!/usr/bin/env node
/* best run when root
 *
 * node server to receive command from instructor server
 *  for shutdown
 *      logoff
 *      lock
 * */
/*
 * usage:
 *  http://host:8286
 *
 *  GET /
 *      returns screenshot of image
 *
 *  POST /
 *      method=
 *          returns currently active window
 *      method=shutdown
 *          shuts down the system
 *      method=logoff
 *          logs off the system
 *      method=lock
 *          disables the mouse and keyboard and turns of the screen
 *      method=lock
 *          enables the mouse and keyboard and turns on the screen
 *
 *  http://localhost:10610
 *
 *  POST /
 *
 *
 * */


var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec,
    fs = require('fs'),
    os = require('os'),
    net = require('net'),
    interfaces = os.networkInterfaces(),
    port = 8286,
    addresses='\n',
    z,
    config = require('./config'),
    SESSIONID,
    headers = {},
    url = require('url');

headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = false;
headers["Access-Control-Max-Age"] = '86400'; // 24 hours
headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

// create a server that listens to localServer port
http.createServer(function(req, res){
    var postData='', decodedBody;
    if (req.method === 'OPTIONS') {
      res.writeHead(200, headers);
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
                console.log(decodedBody);
            } catch (e) {
                console.log(e);
                res.writeHead(500, headers, {'Content-Type':'text/json'});
                res.end('{"status":"Problem with POST data"}');
                return;
            }
            console.log("JSON parse was successful.");
            if(decodedBody.session){
                console.log("session was found from the payload");
                /*
                 *  connect to motherServer and ensure the integrity of sent SESSIONID
                 * */
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
                    response.setEncoding('utf8');
                    response.on('data', function(chunk){
                        integrityCheckResult = chunk;
                        SESSIONID=decodedBody.session;
                        var json;
                        try{
                            json = JSON.parse(integrityCheckResult);
                        } catch (e){
                            res.writeHead(500, headers, {'Content-Type' : 'text/json'});
                            res.end('{"status":"Failed to set session"}');
                        }

                        if(json.access_token === SESSIONID){
                            res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                            res.end('{"status":"Session set"}');
                        } else {
                            res.writeHead(500, headers, {'Content-Type' : 'text/json'});
                            res.end('{"status":"Failed to set session"}');
                        }
                    });
                });

                postRequest.write(postData);
                postRequest.on('error', function(e){
                    console.log(e);
                    res.writeHead(500, headers, {'Content-Type': 'text/json'});
                    res.end('{"status":"Failed to set session"}');
                });
                postRequest.end();
            } else if(decodedBody.hasOwnProperty('destroy')){
                console.log("destroy was found from the payload");
                SESSIONID=undefined;
                res.writeHead(200, headers, {'Content-Type' : 'text/json'});
                res.end('{"status":"Session destroyed"}');
            } else {
                console.log("session was not found from the payload");
                res.writeHead(500, headers, {'Content-Type' : 'text/json'});
                res.end('{"status":"Failed to set session"}');
            }
        });
    }
}).listen(config.sessionPort,'localhost');


/*
 * The server below controls the funtionalities of the following:
 *      Lock/Unlock
 *      Shutdown
 *      Logoff
 *
 * */

http.createServer(function (req, res) {
    var data = '',
    getData='',
    type,
    checkSession=function(callback){
        console.log(SESSIONID === getData.access_token && config.motherServer === req.connection);
        if(!SESSIONID){
            console.log("!sync:"+SESSIONID);
            res.writeHead(401, headers,{'Content-Type':'text/json'});
            res.end('{"status":"Token is not synchronized to localhost"}');
        } else if(SESSIONID !== getData.access_token){
            res.writeHead(401, headers,{'Content-Type':'text/json'});
            res.end('{"status":"Token doesn\'t match."}');
        } else if(SESSIONID === getData.access_token && config.motherServer === req.connection) {
            console.log(SESSIONID);
            callback();
        } else {
            res.writeHead(401, headers,{'Content-Type':'text/json'});
            res.end('{"status":"Server requesting is unidentified."}');
        }
    };

    if (req.method === 'OPTIONS') {
        console.log('OPTIONS');
        res.writeHead(200, headers);
        res.end();
    } else if(req.method === 'GET') {
        getData = url.parse(req.url,true).query;
        type = getData.type || "jpeg";
        checkSession(function(){
            console.log('Received GET Request.');
            var dir = "/tmp/"+SESSIONID+type;
            console.log(__dirname);
            var cmd = __dirname+"/scripts/shot.py "+dir;
            exec(cmd, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
                res.writeHead(200,headers, {'Content-Type' : 'image/png'});
                fs.createReadStream(dir).pipe(res);
            });
        });
    } else if(req.method === 'POST'){
        checkSession(function(){
            console.log('Received POST Request.');
            req.on('end', function () {
                var decodedBody,
                    action = '',
                    msg = '';
                console.log('end-part response.');
                try{
                    decodedBody = JSON.parse(data);
                } catch(e){
                    res.writeHead(500, headers, {'Content-Type':'text/json'});
                    res.end('{\"Status\":\"Problem with POST data\"}');
                    return;
                }
                switch(decodedBody.method){
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
                        decodedBody.method='';
                        msg='ActiveWindow';
                        break;
                }

                // TRY
                try {
                        exec(action, function (err, stdout, stderr) {
                        console.log(err, stdout, stderr);
                        if(decodedBody.method === ''){
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
