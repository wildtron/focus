#!/usr/bin/env node
/*
 * node server to receive command from instructor server
 *  for shutdown
 *      logoff
 *      lock
 * */

var http = require('http'),
    qs = require('querystring'),
    exec = require('child_process').exec;

var host = '127.0.0.1',
    port = '8286';

http.createServer(function (req, res) {
    if(req.method == 'POST'){
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
                    action = 'xinput set-int-prop 10 "Device Enabled" 8 0';
                    msg ='Locking...'
                    break;
                // unlock
                case 'cb47660d0ad27e0e58acc8f42cfd138589f4228e':
                    action = 'xinput set-int-prop 10 "Device Enabled" 8 1'
                    msg = 'Unlocking...'
                default: break;
            }
                if(!(action === '')){
                    var child = exec(action, function (error, stdout, stderr) {
                        console.log(error, stdout, stderr);
                        res.writeHead(200, "OK", {"Content-Type": 'text/json'});
                        res.end('{"Status" : "'+msg+'"}');
                    });
                }
        });
    } else {
        res.writeHead(404, "Not Found", {"Content-Type": 'text/json'});
        res.end('{"Status" : "task unavailable"}');
    }
}).listen(port);

