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
      console.log('Checking for module: ',name);
      child = exec("npm show "+name+" time", function (error, packageTime, stderr) {
        if(error == null) {

            var times = [];
            lines = packageTime.split('\n');
            for (var line in lines) {
              time = lines[line].replace(/['",{}]/g,'').match(/([^:]+): ([^:]+)/);
              if (time && time[1] && time[2]){
                times.push({version:time[1].trim(),time:time[2].trim()});
              }
            }


            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(times));
          } else {
            console.log(error);
          }
      });
    }
  }

}).listen(process.env.PORT || 4000);