#!/usr/bin/env bash

# This is used to run FOCUS desktop application
# not so complicated so don't thinker with it
# okay? :D

arch=`getconf LONG_BIT`

./server/nodejs$arch/bin/node ./server/server.js
