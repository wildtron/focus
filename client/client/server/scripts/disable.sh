#!/bin/bash
enable=0
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+keyboard.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
done
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+pointer.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
done
dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
python $dir/window.py
