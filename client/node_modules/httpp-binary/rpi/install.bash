#!/bin/bash

### download rpi binary package
wget --no-check-certificate https://raw.github.com/InstantWebP2P/httpp-binary/master/rpi/node-v0.8.x-httpp-pi.tar
tar xvf node-v0.8.x-httpp-pi.tar -C ~/

### setup path env
echo 'export PATH=~/node-v0.8.x-httpp-pi/bin/:$PATH' >> ~/.bashrc
source ~/.bashrc

