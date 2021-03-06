http = require("http")
exec = require("child_process").exec
url = require("url")
cache =
  initialized: new Date()
  items: []

daisy = undefined
express = require("express")
engine = require("ejs-locals")
app = express()
app.engine "ejs", engine
app.set "views", __dirname + "/views"
app.set "view engine", "ejs"
app.use express.static(__dirname + "/public")
app.use express.bodyParser()
daisy = (args, fn) ->
  setTimeout args.next = ->
    f = undefined
    if f = args.shift()
      !!f(args) or true
    else
      false
  , 0

fetchTimes = (name, callback) ->
  name = name.replace /([^a-zA-Z|\-])/g, '' # sanitizing the name

  unless cache.items[name]?
    child = exec("npm view #{name} time", (error, packageTime, stderr) ->
      unless error?
        correctedTime = packageTime.replace(/\'/g,"\"") # because npm is strange

        try
          times = JSON.parse(correctedTime)
        catch e
          console.log "ERROR parsing time information for #{name}"
          times = {}

        cache.items[name] = times
        console.log "WARNING no time data found for " + name  if times.length is 0
        callback error, times
      else
        console.log "ERROR fetching information for " + name
        callback error
    )
  else
    callback null, cache.items[name]

app.post "/", (req, res) ->
  query = req.body.names
  fetchModule = (name_, callback) ->
    fetchTimes name_, (error, res) ->
      data[name_] = res  unless error?
      callback error, res


  sendResponse = (data_, callback) ->
    res.end JSON.stringify(data_)
    callback()  if callback

  if Object.keys(query).length isnt 0
    data = {}
    queue = []
    query.forEach (name) ->

      # sanitize name here

      name_ = name.replace(/%s/g, "")
      if name_.length
        queue.push ->
          fetchModule name_, ->
            queue.next()



    queue.push ->
      sendResponse data

    daisy queue

app.get "/", (req, res) ->
  res.render "index", {}

app.listen process.env.PORT or 4000