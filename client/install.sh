#!/usr/bin/env bash
if [[ $EUID -eq 0 ]]; then
    if [[ -d "/opt/focus/" ]]; then
        rm -rf /opt/focus/
    fi
    mkdir /opt/focus
    loc=`dirname $BASH_SOURCE`
    /bin/cp -rvf $loc/* /opt/focus

    exit
else
    echo "This script should be run as root"
    exit
fi
