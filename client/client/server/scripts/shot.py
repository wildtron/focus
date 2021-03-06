#!/usr/bin/env python
import gtk.gdk
import sys

try:
    if len(sys.argv) == 3:
        w = gtk.gdk.get_default_root_window()
        sz = w.get_size()
        print "The size of the window is %d x %d" % sz
        pb = gtk.gdk.Pixbuf(gtk.gdk.COLORSPACE_RGB,False,8,sz[0],sz[1])
        pb = pb.get_from_drawable(w,w.get_colormap(),0,0,0,0,sz[0], sz[1])
        if (pb != None):
            if (sys.argv[2] == "png"):
                pb.save(sys.argv[1],"png")
            else:
                pb.save(sys.argv[1], "jpeg", {"quality": "10"})
        else:
            print "Unable to get the screenshot."
    else:
        print "Missing last parameter. png or jpeg"
        print "Unable to get the screenshot."
except AttributeError:
    print "Turn on the screen."
