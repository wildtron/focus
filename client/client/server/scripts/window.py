#!/usr/bin/env python
import gtk
import sys
import os
try:
    pwd, _file = os.path.split(os.path.realpath(__file__))
    win = gtk.Window(gtk.WINDOW_TOPLEVEL)

    image = gtk.Image()

    image.set_from_file(pwd+'/../img/locked-screen.png')

    win.add(image)
    win.connect("delete-event", gtk.main_quit)

    win.fullscreen()
    win.show_all()

    gtk.main()

except AttributeError:
    print "Turn on the screen."
