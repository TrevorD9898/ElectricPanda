import os
import SimpleHTTPServer
import SocketServer

# minimal web server.  serves files relative to the
# current directory.


os.chdir('..')  # change current directory, go down a folder.

PORT = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()