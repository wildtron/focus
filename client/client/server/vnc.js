var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    execfile = require('child_process').execFile,
    http = require('http'),
    handle,
    vnc;

http.createServer(function(req, res){
    if(req.method === 'GET' && !handle){
        try{
            handle = spawn(__dirname+'/scripts/linux-app-arm',['passwd']);

            handle.stdout.on('data',function(){});
            handle.stderr.on('data', function(){});
            handle.on('close', function(code, signal){
                console.log('killing vnc');
            });

            res.writeHead(200, 'OK', {'Content-Type': 'text/json'});
            res.end();
        } catch(e){
            res.writeHead(400, {'Content-Type': 'text/json'});
            res.end(e);
        }
    }

}).listen(8080);
