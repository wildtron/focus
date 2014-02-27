#!/bin/bash
enable=1
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+keyboard.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+pointer.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable

xset dpms force on
xset s reset
killall gnome-screensaver
