#!/usr/bin/env node
var Keyboard = require('keyboard'), keyboard=[];

keyboard[0] = new Keyboard('event3');

keyboard[0].on('keypress', console.dir);
keyboard[0].on('keyup', console.dir);
keyboard[0].on('keydown', console.dir);
keyboard[0].on('error', console.dir);
