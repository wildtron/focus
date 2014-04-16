#!/usr/bin/env bash
if [[ $EUID -eq 0 ]]; then
    if [[ -d "/opt/focus/" ]]; then
        rm -rf /opt/focus/
    fi
    mkdir /opt/focus
    loc=`dirname $BASH_SOURCE`
    /bin/cp -rvf $loc/* /opt/focus
    if [[ -d "/etc/profile.d/focus.sh" ]]; then
        rm /etc/profile.d/focus.sh
    fi
    echo "#/usr/bin/env bash" > /etc/profile.d/focus.sh
    echo "sudo /opt/focus/run" >> /etc/profile.d/focus.sh
    exit
else
    echo "This script should be run as root"
    exit
fi
