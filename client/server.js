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
 *  http://localhost:8286
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
 * */


var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec,
    fs = require('fs'),
    port = 8286,
    os = require('os'),
    interfaces = os.networkInterfaces(),
    addresses='\n';

for(var z in interfaces){
    addresses+=interfaces[z][0].address+'\n';
}

http.createServer(function (req, res) {
    var headers = {};
    // IE8 does not allow domains to be specified, just the *
    // headers["Access-Control-Allow-Origin"] = req.headers.origin;
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

    // turn on the monitor and enable everything first or else screen shot crashes
    exec('./scripts/enable.sh', function(err, stdout, stderr) {
        if(err) throw err;
    });


    if (req.method === 'OPTIONS') {
      console.log('OPTIONS');
      res.writeHead(200, headers);
      res.end();
    } else if(req.method === 'GET') {
        console.log('Received GET Request.');
        var dir = "/tmp/c9251dada3e9a6216026906764c37c16.png";
        var cmd = "./scripts/shot.py "+dir;
        var child = exec(cmd, function (err, stdout, stderr) {
            if(err) throw err;
            res.writeHead(200,headers, {'Content-Type' : 'image/png'});
            fs.createReadStream(dir).pipe(res);
        });
    } else if(req.method === 'POST'){
        console.log('Received POST Request.');
        var postData = '';

        req.on('data', function (chunk) {
            postData += chunk;
        });

        req.on('end', function () {
            var decodedBody = JSON.parse(postData),
                action = '',
                msg = '';
            console.log(decodedBody);
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
                default:
                    action ="xprop -id $(xprop -root 32x '\t$0' _NET_ACTIVE_WINDOW | cut -f 2) _NET_WM_NAME WM_CLASS";
                    method='';
                    break;
            }
            console.log(decodedBody.method, action);
            if(action !== ''){
                try {
                    var child = exec(action, function (err, stdout, stderr) {
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
                }
            }
        });
    } else {
        res.writeHead(404, "Not Found", headers ,{"Content-Type": 'text/json'});
        res.end('{"status" : "task unavailable"}');
    }

}).listen(port);


console.log("listening on server:"+port);
