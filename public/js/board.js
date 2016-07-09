var groups = { };

var StremioClient = require("stremio-addons").Client;
var stremio = new StremioClient();

[
	"https://cinemeta.strem.io", 
	"https://channels.strem.io", 
	"https://guidebox.strem.io", 
	"https://filmon.strem.io", 
	"https://twitch.strem.io",
	"https://vodo.strem.io",
	//"https://netflix.strem.io",
].forEach(function(url) { stremio.add(url+'/stremioget/stremio/v1') }) // add legacy add-on suffix

stremio.on("addon-ready", function(addon) {
	if (addon.methods.indexOf("meta.find") === -1) return;

	var sorts = addon.manifest.sorts;

	(addon.manifest.sorts || [null]).forEach(function(sort) {
		((sort && sort.types) || addon.manifest.types).forEach(function(type) {
			if (!type) return;
			
			var args = { query: { type: type }, limit: 50 };
			if (sort) {
				args.sort = { };
				args.sort[sort.prop] = -1;
				// args.sort.popularity = -1
			}

			pullMetaGroup(addon, args, sort);
		});
	});
});

function pullMetaGroup(addon, args, sort) {
	var id = addon.identifier()+":"+args.query.type+":"+(sort && sort.prop);

	if (groups.hasOwnProperty(id)) return;
	groups[id] = { items: [] };

	stremio.fallthrough([addon], "meta.find", args, function(err, res) {
		if (err) return console.error(err);

		console.log("pulled "+res.length+" items for "+addon.identifier()+" for "+args.query.type);
		if (! res.length) return;

		var group = groups[id] = {
			type: args.query.type,
			sort: sort,
			addon: addon,
			items: res.map(function(x) { return new metadata(x) }).filter(function(x) { return x._poster }).slice(0,6),

		};

		updateView();
	});
}

function metadata(d) {
	var self = this;

	for (key in d) this[key] = d[key];

	self.popularities = self.popularities || {};
	self._id = self.id || self._id;

	self.getPoster = function() {
		if (self.imdb_id) poster = "http://img.omdbapi.com/?i="+self.imdb_id+"&apikey=a38ae05f&h=400";
		if (self.poster) return self.poster;
	};

	self._poster = self.getPoster();
}

var view;
window.onload = function() {
	view = Monkberry.render(Board, document.body);
	view.update({ groups: groups });
}

var timeout;
function updateView() {
	//if (view) view.update({ groups: groups })
	if (timeout) clearTimeout(timeout);
	timeout = setTimeout(function() { 
		if (view) view.update({ groups: groups });
		updateSelected();
	}, 150);
}

var selected;
function updateSelected() {
	var groupKeys = Object.keys(groups);

	if (!selected)  {
		var firstGroup = groups[groupKeys[0]];
		var firstItem = firstGroup && firstGroup.items && firstGroup.items[0];
		document.querySelector('.boardItem[data-id='+firstGroup.items[0]._id+']').classList.add('focused');
	}

}
