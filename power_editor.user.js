// ==UserScript==
// @name          MusicBrainz power editor
// @description   Provide power editor tools for quick massive editing in MusicBrainz
// @include       http://musicbrainz.org/*
// @match         http://musicbrainz.org/*
// ==/UserScript==

function PowerEditor() {
	function prependChild(whereTo, what) {
		var whereToFc = whereTo.firstChild;
		whereTo.insertBefore(what, whereToFc);
	}

	this.addPowerEditorPanel = function() {
		// Add styles
		var styles = document.createElement('style');
		styles.innerHTML = '#pwe-panel { width: 30em; float: left; padding-right: 0.5em; background: #ffffd8; z-index: 50; };\n' +
			'#pwe-panel .cmd { width: 2em; float: right; };\n' +
			'#pwe-mode-rel { display: none; };\n' +
			'#pwe-mode-recwork { display: none; };\n';
		prependChild(document.body, styles);

		// Fix content style
		document.getElementById('content').style.marginLeft = '31em';

		// Add panel
		var panel = document.createElement('div');
		panel.setAttribute('id', 'pwe-panel');

		panel.innerHTML = '<h1>Power editor</h1>\n' +
			'<div class="mode">\n' +
			'Mode: <select id="pwe-mode" onchange="pwe.updateMode(this.value)">\n' +
			'<option value="rel">Relate</option>\n' +
			'<option value="recwork">Rec &rarr; Work</option>\n' +
			'</select>\n' +
			'<button>Go!</button>\n' +
			'</div>\n' +
			'<div id="pwe-mode-rel">Relationships...</div>\n' +
			'<div id="pwe-mode-recwork">Rec - work...</div>\n' +
			'<h2>Music</h2>\n' +
			'<div id="pwe-releases"></div>\n' +
			'<h2>Group</h2>\n' +
			'<div id="pwe-groups"></div>\n' +
			'<h2>People</h2>\n' +
			'<div id="pwe-people"></div>\n';

		prependChild(document.getElementById('page'), panel);

		this.updateList('releases');
		this.updateList('groups');
		this.updateList('people');
	}

	this.loadJSONArrayFromStorage = function(key) {
		var str = localStorage[key];
		if (str) {
			return JSON.parse(str);
		} else {
			return [];
		}
	}

	this.saveToStorage = function() {
		localStorage['pwe_releases'] = JSON.stringify(this.releases);
		localStorage['pwe_groups'] = JSON.stringify(this.groups);
		localStorage['pwe_people'] = JSON.stringify(this.people);
	}

	this.updateList = function(listId) {
		var arr = this[listId];
		var str = '';
		for (var i = 0; i < arr.length; i++) {
			str = '<li><button class="cmd" onclick="pwe.forget(pwe.' + listId + ', ' + i + ');">⊗</button><a href="' + arr[i].id + '">' + arr[i].title + '</a></li>\n' + str;
		}
		str = '<ul>\n' + str + '</ul>\n';

		var listDiv = document.getElementById('pwe-' + listId);
		listDiv.innerHTML = str;
	}

	this.memorize = function(listId, title, id) {
		var arr = this[listId];

		// Check if it already exists
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == id) {
				// Already exists, do nothing
				// TODO: pump it to the top of the list
				return;
			}
		}
		arr.push({id: id, title: title});
		this.saveToStorage();

		this.updateList(listId);
	}

	this.grabCurrentPageEntities = function() {
		var content = document.getElementById('content');
		var hdr = content.firstElementChild;
		if (hdr.className == 'releaseheader') {
			// Release page
			var link = hdr.firstElementChild.firstElementChild;
			this.memorize('releases', link.innerHTML, link.href);
		}
		if (content.firstElementChild.className == 'artistheader') {
			// Artist page
			var artistType = hdr.children[1].innerText;
			var link = hdr.firstElementChild.firstElementChild;
			if (artistType == '~ Person') {
				this.memorize('people', link.innerHTML, link.href);
			} else if (artistType == '~ Group') {
				this.	memorize('groups', link.innerHTML, link.href);
			}
		}
	}

	this.allModes = [
		'rel',
		'recwork',
	];

	this.updateMode = function(newMode) {
		for (var i = 0; i < allModes.length; i++) {
			var el = document.getElementById('pwe-mode-' + allModes[i]);
			el.style.display = (allModes[i] == newMode) ? 'block' : 'none';
		}
	}

	this.forget = function(what) {
		alert(what);
	}

	this.releases = this.loadJSONArrayFromStorage('pwe_releases');
	this.groups = this.loadJSONArrayFromStorage('pwe_groups');
	this.people = this.loadJSONArrayFromStorage('pwe_people');

	this.addPowerEditorPanel();
	this.grabCurrentPageEntities();
}

// Trick to escape default userscripts scope into global window scope
var script = document.createElement('script');
script.appendChild(document.createTextNode('' + PowerEditor + '; window.pwe = new PowerEditor();'));
document.body.appendChild(script);
