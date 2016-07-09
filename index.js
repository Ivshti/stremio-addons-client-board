var express = require('express');
var http = require('http');
var url = require('url');

app = express();
app.use(express.static('public'));

app.set('port', process.env.PORT || 9900);

app.get("/js/stremio-addons.min.js", function(req, res) {
  res.sendFile("./node_modules/stremio-addons/browser/stremio-addons.min.js", { root: __dirname }, function(e) { e && console.error(e) });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

