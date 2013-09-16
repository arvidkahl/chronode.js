var http = require('http');
var exec = require('child_process').exec;
var url = require('url');

var cache = { initialized : new Date(), items : [] }

var daisy;

var express = require('express')
  , engine = require('ejs-locals')
  , app = express();

app.engine('ejs', engine);

app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

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
      if(cache.items[name]==null){
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
              if (times.length == 0) {console.log("WARNING no time data found for "+name); }
              callback(error, times);
            } else {
              console.log('ERROR fetching information for '+name);
              callback(error)
            }
          });
        }
        else {
          callback(null,cache.items[name]);
        }
    }


app.post('/',function (req,res) {
  var query = req.body.names;

  fetchModule = function(name_,callback){
      fetchTimes(name_,function(error,res){
        if(error == null) { data[name_]=res; }
        callback(error, res);
      });
    }

  sendResponse = function(data_,callback){
    res.end(JSON.stringify(data_));
    if(callback){ callback(); }
  }

  if (Object.keys(query).length !== 0) {
    var data = {};
    var queue = [];

    query.forEach( function(name){
      var name_=name.replace(/%s/g,'');
      if(name_.length){
        queue.push(function(){
          fetchModule(name_,function(){
            queue.next();
          });
        });
      }
    });

    queue.push(function(){sendResponse(data)});
    daisy(queue);

    }
  });


app.get('/',function (req, res) {
  res.render('index',{});
});

app.listen(process.env.PORT || 4000);