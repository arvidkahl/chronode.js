var http = require('http');
var exec = require('child_process').exec;
var url = require('url');

var cache = { initialized : new Date(), items : [] }

var daisy;

daisy = function(args, fn) {
  return setTimeout(args.next = function() {
    var f;
    if ((f = args.shift())) {
      return !!f(args) || true;
    } else {
      return false;
    }
  }, 0);
};


fetchTimes =  function(name,callback){

      // console.log('fetchTimes: Checking for module: ',name);

      if(cache.items[name]==null){

        // console.log('fetchTimes: '+name+' not cached. Fetching.');

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

              cache.items[name]=times;
              // console.log('fetchTimes: calling back with new object');
              if (times.length == 0) {console.log("WARNING no time data found for "+name); }
              callback(error, times);

            } else {
              console.log('ERROR fetching information for '+name);
              callback(error)
            }
          });
        }
        else {
          // console.log('fetchTimes: calling back with old object');
          // console.log("FetchTimes: "+name+' found in cache.');
          callback(null,cache.items[name]);
        }
    }
// main process

http.createServer(function (req, res) {

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  // console.log('main: query is '+ query);

  if (Object.keys(query).length !== 0) {

    // console.log('main: Getting npm result');

    var data = {};
    var queue = [];

    fetchModule = function(name_,callback){
        // console.log('fetchModule');
        fetchTimes(name_,function(error,res){
          // console.log('fetchModule: Fetching done for '+name_);
          if(error == null) { data[name_]=res; }
          callback(error, res);
        });
      }

    sendResponse = function(data_,callback){
      // console.log('sendResponse: Done fetching. Sending data.');

      content = 'This is it!'+'<script>var a = '+JSON.stringify(data_)+"</script>";
      res.writeHead(200, {'Content-Type': 'text/plain'});

      // console.log('Content: ',content);
      res.end(content);
      if(callback){callback();}
    }

    names = [];
    for (var name in query) {names.push(name)}

    names.forEach( function(name){

      var name_=name.replace(/%s/g,'');

      if(name_.length){
        queue.push(function(){
          fetchModule(name_,function(){
            queue.next();
          });
        });
      }
    });

    // console.log('Pushing response');
    queue.push(function(){sendResponse(data)});

    // console.log('running queue');
    daisy(queue);

    }

}).listen(process.env.PORT || 4000);