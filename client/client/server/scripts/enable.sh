#!/bin/bash
enable=1
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+keyboard.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
done
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+pointer.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
done

kill `ps aux | grep window\.py | grep python | awk  '{ print $2 }'`
killall gnome-screensaver
