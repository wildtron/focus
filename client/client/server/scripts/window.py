#!/usr/bin/env python
import gtk
import sys

try:
    if len(sys.argv) == 1:
        win = gtk.window()
        win.fullscreen()
    else:
        print "Missing image!"
except AttributeError:
    print "Turn on the screen."
