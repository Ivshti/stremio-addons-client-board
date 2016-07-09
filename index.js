var express = require('express');
var http = require('http');
var url = require('url');
var stylus = require('stylus');
var nib = require('nib');

app = express();

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(stylus.middleware(
  { src: __dirname + '/styl',
    dest: __dirname + '/public/stylesheets',
    compile: compile
  }
))
app.use(express.static('public'));

app.set('port', process.env.PORT || 9900);

app.get("/", function(req, res) {
	res.render("index", { });
})

app.get("/js/stremio-addons.min.js", function(req, res) {
  res.sendFile("./node_modules/stremio-addons/browser/stremio-addons.min.js", { root: __dirname }, function(e) { e && console.error(e) });
});
app.get("/js/monkberry/monkberry.js", function(req, res) {
  res.sendFile("./node_modules/monkberry/monkberry.js", { root: __dirname }, function(e) { e && console.error(e) });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

