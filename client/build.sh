#!/usr/bin/env bash
cd client/
rm app.nw
./repack 32
cd ..
mkdir out32
mkdir out64
cat client/nodewebkit/nodewebkit32/nw client/app.nw > out32/app.run
cp client/nodewebkit/nodewebkit32/* out32/
chmod +x out32/app.run
rm out32/nw
cd client/
rm app.nw
./repack 64
cd ..
cat client/nodewebkit/nodewebkit64/nw client/app.nw > out64/app.run
cp client/nodewebkit/nodewebkit64/* out64/
chmod +x out64/app.run
rm out64/nw
