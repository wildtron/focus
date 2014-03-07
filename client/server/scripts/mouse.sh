#!/bin/bash
first_arg=$(echo $1 | tr [:upper:] [:lower:])
case $first_arg in
    enable ) enable=1 ;;
    disable ) enable=0 ;;
    * ) echo "Usage: $0 [enable|disable]"; exit 1 ;;
esac
ids=$(xinput list | sed -ne 's/.*id=\(\S\+\).*slave\s\+pointer.*/\1/p')
for i in $ids; do
    xinput set-prop $i 'Device Enabled' $enable
done
