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
	//"https://nfxaddon.strem.io",
].forEach(function(url) { stremio.add(url+'/stremioget/stremio/v1') }) // add legacy add-on suffix

stremio.on("addon-ready", function(addon) {
	if (addon.methods.indexOf("meta.find") === -1) return;

	var sorts = addon.manifest.sorts;

	(addon.manifest.sorts || [null]).forEach(function(sort) {
		((sort && sort.types) || addon.manifest.types).forEach(function(type) {
			if (!type) return;
			
			if ( (sort && sort.countrySpecific) || addon.manifest.countrySpecific) return;

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
			id: id,
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
	self._id = self.id || self._id || self.imdb_id || (self.yt_id && 'yt_id:'+self.yt_id) || (self.filmon_id && 'filmon_id:'+self.filmon_id) || 'rand-'+Date.now();

	self.getPoster = function() {
		if (self.imdb_id) poster = "http://img.omdbapi.com/?i="+self.imdb_id+"&apikey=a38ae05f&h=400";
		if (self.poster) return self.poster;
	};

	self._poster = self.getPoster();
}

var view;
window.onload = function() {
	view = Monkberry.render(Board, document.body, { });
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
function firstItem() {
	var groupKeys = Object.keys(groups);
	var firstGroup = groups[groupKeys[0]];
	var firstItem = firstGroup && firstGroup.items && firstGroup.items[0];
	return firstItem;
}
function updateSelected() {
	if (!selected)  {
		var first = firstItem();
		if (first) document.querySelector('.boardItem[data-id="'+first._id+'"]').classList.add('focused');
		return;
	}

	document.querySelector('.boardItem.focused').classList.remove('focused');
	document.querySelector('.boardItem[data-id="'+selected+'"]').classList.add('focused');
}

document.onkeydown = function(e) {
	var first = firstItem();
	if (! selected) selected = first._id;

	// find current x, y; don't keep them as state, because we can load new rows anytime
	var x, y;
	var groupKeys = Object.keys(groups);
	groupKeys.forEach(function(k, i) {
		(groups[k].items || []).forEach(function(item, j) {
			if (item._id && (item._id === selected)) { y = i; x = j; }
		})
	});

	// apply command from user
	if (e.keyCode === 37) x--; // left
	else if (e.keyCode === 39) x++; // right
	else if (e.keyCode === 38) y--; // up
	else if (e.keyCode === 40) y++; // down
	else return;

	e.preventDefault();

	// set new 'selected', update it in the DOM
	var group = groups[groupKeys[y]];
	if (! group) return;

	var item = group.items[x];
	if (! item) return;

	selected = item._id;
	updateSelected();

	location.href = "#";
	location.href = "#"+groupKeys[y];
};

document.onclick = document.ontouchstart = function(e) {
	if (e.target.classList.contains('boardItem')) selected = e.target.getAttribute('data-id');
	updateSelected()
}
