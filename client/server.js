#!/usr/bin/env node
/*
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
 *      method=d343cb3959edc5a5516dc4ed1c6c5c8a7ab9f5a5
 *          shuts down the system
 *      method=8ffc8019bbc93e32e1133b5a4bd221fc65fbd36a
 *          logs off the system
 *      method=e6d41daeb91d3390e512a1a7ecfe99a2dc572caa
 *          disables the mouse and keyboard and turns of the screen
 *      method=cb47660d0ad27e0e58acc8f42cfd138589f4228e
 *          enables the mouse and keyboard and turns on the screen
 *
 * */


var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec,
    fs = require('fs'),
    port = '8286',
    os = require('os')
    interfaces = os.networkInterfaces(),
    addresses='\n';

for(var z in interfaces){
    addresses+=interfaces[z][0].address+'\n';
}


http.createServer(function (req, res) {
    if(req.method == 'GET') {
        console.log('Received GET Request.');
        var dir = "/tmp/c9251dada3e9a6216026906764c37c16.png";
        var cmd = "scrot "+dir;
        var child = exec(cmd, function (err, stdout, stderr) {
            if(err) throw err;
            res.writeHead(200, {'Content-Type' : 'image/png'});
            fs.createReadStream(dir).pipe(res);
        });
    } else if(req.method == 'POST'){
        console.log('Received POST Request.');
        var postData = '';

        req.on('data', function (chunk) {
            postData += chunk;
        });

        req.on('end', function () {
            var decodedBody = qs.parse(postData),
                action = '',
                msg = '';
            switch(decodedBody.method){
                // shutdown
                case 'd343cb3959edc5a5516dc4ed1c6c5c8a7ab9f5a5':
                    action = 'shutdown -h now';
                    msg = 'Shutting down'
                    break;
                // logoff
                case '8ffc8019bbc93e32e1133b5a4bd221fc65fbd36a':
                    action = '';
                    msg = 'Logging off...';
                    break;
                // lock
                case 'e6d41daeb91d3390e512a1a7ecfe99a2dc572caa':
                    /*
                     *  turn off screen and enable screensaver
                     *  xset dpms force off
                     * */
                    action = 'xinput set-int-prop 2 "Device Enabled" 8 0';
                    msg ='Locking...'
                    break;
                // unlock
                case 'cb47660d0ad27e0e58acc8f42cfd138589f4228e':
                    /*
                     * turn on screen and disable screensaver
                     * xset dpms force on
                     * xset s reset
                     *
                     * */

                    action = 'xinput set-int-prop 2 "Device Enabled" 8 1'
                    msg = 'Unlocking...'
                default:
                    action ="xprop -id $(xprop -root 32x '\t$0' _NET_ACTIVE_WINDOW | cut -f 2) _NET_WM_NAME WM_CLASS";
                    method='';
                    break;
            }
                if(!(action === '')){
                    var child = exec(action, function (err, stdout, stderr) {
                        if(err) throw err;
                        console.log(err, stdout, stderr);
                        if(method==''){
                            msg = stdout.split("_NET_WM_NAME(UTF8_STRING) = ")[1];
                            var t = msg.split("WM_CLASS(STRING) = ");
                            msg = (t[1].split(",")[0] +'::'+ t[0]).replace('\n','').replace('"::"',' <:> ');
                            console.log(msg);
                        }
                        res.writeHead(200, "OK", {"Content-Type": 'text/json'});
                        res.end('{"Status" : '+msg+'}');
                    });
                }
        });
    } else {
        res.writeHead(404, "Not Found", {"Content-Type": 'text/json'});
        res.end('{"Status" : "task unavailable"}');
    }
}).listen(port);

console.log("listening on "+addresses+':'+port);
