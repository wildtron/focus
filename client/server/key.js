var fs = require('fs'),
    exec = require('child_process').exec,
    Keyboard = require('keyboard'),
    child, action;

child = exec('cat /proc/bus/input/devices | grep sysrq | awk \'{print $4}\'', function(err, stdout, stderr){
    if(!err){
        var devices = stdout.split("\n"),
            i,len, keyboard=[];
        // remove last element which is ""
        devices.pop();
        len=devices.length;
        // last_type holds the last time that the user typed a key
        var last_type= (+new Date/1000).toFixed(0),
            backspaces = 0,
            typing = function(obj){
                console.log(obj);
                idle_time = obj.timeS - last_type;
                if(obj.keyCode == 14)
                    backspaces++;
                else {
                    (backspaces<0) ? backspaces =0: backspaces--;
                }

                if(idle_time === 20 && backspaces ===0){
                    console.log('bored');
                }

                last_type=obj.timeS;
            };

        for(i=0;i<len;i++){
            keyboard[i] = new Keyboard(devices[i]);
            keyboard[i].on('keydown', typing);
            keyboard[i].on('keypress', typing);
            keyboard[i].on('error', console.log(devices[i], e));
        }

    } else {
        console.log(err, stderr);
        console.log('Monitoring is impossible.');
    }
});
