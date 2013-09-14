var http = require('http');
var fs = require('fs');
var exec = require('child_process').exec;
var url = require('url');

var index = 'ohai'
  // fs.readFileSync('index.html');

http.createServer(function (req, res) {
  console.log('Getting npm result');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  if (query!=={}) {
    for (var name in query) {
      console.log(name);
      child = exec("npm show "+name, function (error, package, stderr) {
        if(error == null) {

          // Problem: JSON is malformed, need to find a way to parse it.
          console.log(package);

          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('nothing so far');
        } else {console.log(error);}

      });
    }
  }

}).listen(process.env.PORT || 4000);