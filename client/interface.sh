#!/usr/bin/env bash

# This is used to run FOCUS desktop application
# not so complicated so don't thinker with it
# okay? :D

arch=`getconf LONG_BIT`

rm /home/user/Desktop/focus/client/app.nw
zip /home/user/Desktop/focus/client/app.nw /home/user/Desktop/focus/client/index.html /home/user/Desktop/focus/client/package.json /home/user/Desktop/focus/client/css/* /home/user/Desktop/focus/client/font/* /home/user/Desktop/focus/client/img/* /home/user/Desktop/focus/client/js/*
/home/user/Desktop/focus/client/node_modules/nodewebkit/nodewebkit$arch/nw /home/user/Desktop/focus/client app.nw
