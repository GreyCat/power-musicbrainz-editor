// ==UserScript==
// @name          MusicBrainz power editor
// @description   Provide power editor tools for quick massive editing in MusicBrainz
// @include       http://musicbrainz.org/*
// @match         http://musicbrainz.org/*
// ==/UserScript==

function PowerEditor() {
	var releases;
	var groups;
	var people;

	function prependChild(whereTo, what) {
		var whereToFc = whereTo.firstChild;
		whereTo.insertBefore(what, whereToFc);
	}

	function add_power_editor_panel() {
		// Add styles
		var styles = document.createElement('style');
		styles.innerHTML = '#pwe-panel { width: 30em; float: left; padding-right: 0.5em; background: #ffffd8; z-index: 50; };\n' +
			'#pwe-panel .cmd { width: 2em; float: right; };';
		prependChild(document.body, styles);

		// Fix content style
		document.getElementById('content').style.marginLeft = '31em';

		// Add panel
		var panel = document.createElement('div');
		panel.setAttribute('id', 'pwe-panel');

		panel.innerHTML = '<h1>Power editor</h1>\n' +
			'<div class="mode">\n' +
			'Mode: <select id="pwe-mode" onchange="pwe.updateMode(this)">\n' +
			'<option value="rel">Relate</option>\n' +
			'<option value="recwork">Rec &rarr; Work</option>\n' +
			'</select>\n' +
			'</div>\n' +
			'<h2>Music</h2>\n' +
			'<div id="pwe-releases"></div>\n' +
			'<h2>Group</h2>\n' +
			'<div id="pwe-groups"></div>\n' +
			'<h2>People</h2>\n' +
			'<div id="pwe-people"></div>\n';

		prependChild(document.getElementById('page'), panel);

		update_releases();
		update_groups();
		update_people();
	}

	function load_json_array_from_storage(key) {
		var str = localStorage[key];
		if (str) {
			return JSON.parse(str);
		} else {
			return [];
		}
	}

	function load_from_storage() {
		releases = load_json_array_from_storage('pwe_releases');
		groups = load_json_array_from_storage('pwe_groups');
		people = load_json_array_from_storage('pwe_people');
	}

	function save_to_storage() {
		localStorage['pwe_releases'] = JSON.stringify(releases);
		localStorage['pwe_groups'] = JSON.stringify(groups);
		localStorage['pwe_people'] = JSON.stringify(people);
	}

	function update_releases() {
		var str = '\n<ul>\n';
		for (var i = 0; i < releases.length; i++) {
			str += '<li><a href="' + releases[i].id + '">' + releases[i].title + '</a></li>\n';
		}
		str += '</ul>\n';

		var listDiv = document.getElementById('pwe-releases');
		listDiv.innerHTML = str;
	}

	function update_groups() {
		var str = '\n<ul>\n';
		for (var i = 0; i < groups.length; i++) {
			str += '<li><a href="' + groups[i].id + '">' + groups[i].title + '</a></li>\n';
		}
		str += '</ul>\n';

		var listDiv = document.getElementById('pwe-groups');
		listDiv.innerHTML = str;
	}

	function update_people() {
		var str = '\n<ul>\n';
		for (var i = 0; i < people.length; i++) {
			str += '<li><a href="' + people[i].id + '">' + people[i].title + '</a></li>\n';
		}
		str += '</ul>\n';

		var listDiv = document.getElementById('pwe-people');
		listDiv.innerHTML = str;
	}

	function memorize(arr, title, id) {
		// Check if it already exists
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == id) {
				// Already exists, do nothing
				// TODO: pump it to the top of the list
				return;
			}
		}
		arr.push({id: id, title: title});
		save_to_storage();

		if (arr == releases) {
			update_releases();
		} else if (arr == groups) {
			update_groups();
		} else if (arr == people) {
			update_people();
		}
	}

	function grab_current_page_entities() {
		var content = document.getElementById('content');
		var hdr = content.firstElementChild;
		if (hdr.className == 'releaseheader') {
			// Release page
			var link = hdr.firstElementChild.firstElementChild;
			memorize(releases, link.innerHTML, link.href);
		}
		if (content.firstElementChild.className == 'artistheader') {
			// Artist page
			var artistType = hdr.children[1].innerText;
			var link = hdr.firstElementChild.firstElementChild;
			if (artistType == '~ Person') {
				memorize(people, link.innerHTML, link.href);
			} else if (artistType == '~ Group') {
				memorize(groups, link.innerHTML, link.href);
			}
		}
	}

	load_from_storage();
	add_power_editor_panel();
	grab_current_page_entities();

	this.updateMode = function(which) {
		alert(which);
	}
}

// Trick to escape default userscripts scope into global window scope
var script = document.createElement('script');
script.appendChild(document.createTextNode('' + PowerEditor + '; window.pwe = new PowerEditor();'));
document.body.appendChild(script);
