var groups = { };

var StremioClient = require("stremio-addons").Client;
var stremio = new StremioClient();

[
	"https://cinemeta.strem.io", 
	"https://channels.strem.io", 
	"https://guidebox.strem.io", 
	"https://filmon.strem.io", 
	"https://twitch.strem.io",
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
    groups[id] = null;

    stremio.fallthrough([addon], "meta.find", args, function(err, res) {
        if (err) return console.error(err);

        console.log("pulled "+res.length+" items for "+addon.identifier()+" for "+args.query.type);
        if (! res.length) return;

       	var group = groups[id] = {
       		type: args.query.type,
       		sort: sort,
       		addon: addon,
       		items: res
       	};
    });
}

window.onload = function() {
	var view = Monkberry.render(BoardRow, document.body);
	view.update({ type: 'movie' });
}


