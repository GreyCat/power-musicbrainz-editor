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
		styles.innerHTML = '' +
			'body { position: relative; padding: 0 0 0 30.5em; }\n' +
			'#pwe-panel { position: absolute; top: 0; bottom: 0; left: 0; width: 30em; }\n' +
			'#pwe-panel-back { padding: 0 0.5em; background: #ffffd8; }\n' +
			'#pwe-go { width: 10em; float: right; }\n' +
			'#pwe-mode { width: auto; }\n' +
			'.cmd { width: 2em; float: right; background: #ccc; display: inline-block; text-align: center; border: 1px solid #999; cursor: pointer; }\n' +
			'#pwe-panel .checked { background: #999; border: 1px solid #555; }\n' +
			'#pwe-panel .settings-button { display: inline-block; float: right; background: #ccc; border: 1px solid #999; cursor: pointer; padding: 0 1em; }\n' +
			'#pwe-settings-panel { position: absolute; width: 30em; height: 15em; top: 5em; left: 20em; z-index: 100500; background: #eee; border: 1px solid #a1a1a1; padding: 0.5em 1em; display: none; }\n' +
			'#pwe-settings button { width: 10em; padding: 0 5em; }\n' +
			'#header-menu div.l { display: none; }\n' +
			'#header-menu div.r { display: none; }\n' +
			'#header-menu { border-bottom-right-radius: 8px; border-bottom-left-radius: 8px; }\n' +
			'.br { display: none !important; }\n' +
			'.bl { display: none !important; }\n' +
			'.tr { display: none !important; }\n' +
			'.tl { display: none !important; }\n' +
			'#page { border-radius: 8px; }\n' +
			'';
		prependChild(document.body, styles);

		// Add panel
		var panel = document.createElement('div');
		panel.setAttribute('id', 'pwe-panel');

		panel.innerHTML = '' +
			'<div id="pwe-panel-back">\n' +
			'<a class="settings-button" onclick="pwe.settingsDialog()">settings</a>\n' +
			'<h1>Power editor</h1>\n' +
			'<div class="mode">\n' +
			'<button type="button" id="pwe-go" onclick="pwe.go()">Go!</button>\n' +
			'Mode: <select id="pwe-mode" onchange="pwe.updateMode(this.value)">\n' +
			'<option value="rel">Relate</option>\n' +
			'<option value="recwork">Rec &rarr; Work</option>\n' +
			'</select>\n' +
			'</div>\n' +
			'<div id="pwe-mode-rel">Relationships...</div>\n' +
			'<div id="pwe-mode-recwork">Rec - work...</div>\n' +
			'<h2>Music</h2>\n' +
			'<div id="pwe-releases"></div>\n' +
			'<h2>Group</h2>\n' +
			'<div id="pwe-groups"></div>\n' +
			'<h2>People</h2>\n' +
			'<div id="pwe-people"></div>\n' +
			'<div id="pwe-settings-panel">\n' +
			'<h1>Settings - Power MusicBrainz Editor</h1>\n' +
			'<form name="pweSettings">\n' +
			'<div>\n' +
			'<input type="checkbox" name="fixRounded"/>' +
			'<label for="fixRounded">Fix rounded corners</label>\n' +
			'</div>\n' +
			'<button type="button" onclick="pwe.settingsOk()">OK</button>\n' +
			'<button type="button" onclick="pwe.settingsClose()">Cancel</button>\n' +
			'</form>\n' +
			'</div>\n' +
			'</div>\n';

		prependChild(document.body, panel);

		this.updateMode('rel');
	}

	this.loadJSONArrayFromStorage = function(key) {
		var str = localStorage[key];
		if (str) {
			return JSON.parse(str);
		} else {
			return [];
		}
	}

	this.loadJSONObjectFromStorage = function(key) {
		var str = localStorage[key];
		if (str) {
			return JSON.parse(str);
		} else {
			return {};
		}
	}

	this.saveToStorage = function() {
		localStorage['pwe_releases'] = JSON.stringify(this.releases);
		localStorage['pwe_groups'] = JSON.stringify(this.groups);
		localStorage['pwe_people'] = JSON.stringify(this.people);
		localStorage['pwe_settings'] = JSON.stringify(this.settings);
	}

	this.updateList = function(listId) {
		var mode = document.getElementById('pwe-mode').value;

		var str = '';
		var arr = this[listId];
		for (var i = 0; i < arr.length; i++) {
			str = '<li>' + this.listLine(mode, listId, arr, i) + '</li>\n' + str;
		}
		str = '<ul>\n' + str + '</ul>\n';

		var listDiv = document.getElementById('pwe-' + listId);
		listDiv.innerHTML = str;
	}

	this.updateLists = function() {
		this.updateList('releases');
		this.updateList('groups');
		this.updateList('people');
	}

	listToEntity = {
		releases: 'release',
		groups: 'artist',
		people: 'artist',
	};

	this.listLine = function(mode, listId, arr, i) {
		var cmd = '<a class="cmd" onclick="pwe.forget(&quot;' + listId + '&quot;, ' + i + ');">⊗</a>';
		if (mode == 'rel') {
			cmd += '<a class="cmd' + (arr[i].relR ? ' checked' : '') + '" onclick="pwe.relate(1, &quot;' + listId + '&quot;, ' + i + ');">◗</a>';
			cmd += '<a class="cmd' + (arr[i].relL ? ' checked' : '') + '" onclick="pwe.relate(0, &quot;' + listId + '&quot;, ' + i + ');">◖</a>';
		}
		return cmd + '<a href="/' + listToEntity[listId] + '/' + arr[i].id + '">' + arr[i].title + '</a>';
	}

	this.memorize = function(listId, title, href) {
		var id = href.replace(/^.*\//, '');
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

		// No content on this page? We won't grab anything
		if (!content)
			return;

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
				this.memorize('groups', link.innerHTML, link.href);
			}
		}
	}

	this.modifyPage = function() {
		// Add "relate work" buttons to all tracks, if applicable
		var r = document.evaluate('//*[@rel="mo:track"]', document, null, XPathResult.ANY_TYPE, null);
		var tracks = [];
		var n = r.iterateNext();
		while (n) {
			tracks.push(n);
			n = r.iterateNext();
		}
		for (var i = 0; i < tracks.length; i++) {
			var td = tracks[i].children[1];
			var title = td.getElementsByTagName('span')[0].getAttribute('content');
			var id = td.getElementsByTagName('a')[0].getAttribute('resource');
			id = id.replace(/^.*\//, '').replace(/#_$/, '');

			// setTimeout is a hack to make sure that relate
			// to dialog would be shown, despite on "hide"
			// default action firing on any onclick event in
			// the body; it's lame, but it works for now
			td.innerHTML = '<button class="cmd" id="pwe-relcmd' + i + '" onclick="setTimeout(function(){pwe.relateRecToWork(' + i + ', \'' + id + '\', \'' + title + '\');}, 50); return false;">○</button>' + td.innerHTML;
		}
	}

	allModes = [
		'rel',
		'recwork',
	];

	this.updateMode = function(newMode) {
		for (var i = 0; i < allModes.length; i++) {
			var el = document.getElementById('pwe-mode-' + allModes[i]);
			el.style.display = (allModes[i] == newMode) ? 'block' : 'none';
		}
		this.updateLists();
	}

	this.forget = function(listId, num) {
		this[listId].splice(num, 1);
		this.updateList(listId);
		this.saveToStorage();
	}

	this.relate = function(side, listId, num) {
		relName = (side == 0) ? 'relL' : 'relR';
		var el = this[listId][num];
		if (el[relName]) {
			delete el[relName];
		} else {
			el[relName] = 1;
		}
		this.updateList(listId);
		this.saveToStorage();
	}

	this.go = function() {
		var mode = document.getElementById('pwe-mode').value;

		if (mode == 'rel') {
			this.goRel();
		} else {
			console.error("Unknown mode: " + mode);
		}
	}

	this.goRel = function() {
		var arrL = this.groups;
		var arrR = this.people;

		var indL = null;
		for (var i = 0; i < arrL.length; i++) {
			if (arrL[i].relL == 1) {
				indL = i;
				break;
			}
		}
		if (indL == null) {
			alert("No group chosen");
			return;
		}
		var elL = arrL[indL];

		var indR = null;
		for (var i = 0; i < arrR.length; i++) {
			if (arrR[i].relR == 1) {
				indR = i;
				break;
			}
		}
		if (indR == null) {
			alert("No member chosen");
			return;
		}
		var elR = arrR[indR];

		window.location.href = 'http://musicbrainz.org/edit/relationship/create?type0=artist&type1=artist&entity0=' + elL.id + '&entity1=' + elR.id;
	}

	this.relateRecToWork = function(num, recId, title) {
		var btn = $('#pwe-relcmd' + num);

		// Show relateTo dialog
		var relateTo = MB.Control.RelateTo();
		relateTo.show(new MouseEvent('click'));
		relateTo.$relate.offset(btn.offset());

		// Set up "from" entity
		relateTo.$type0 = { val: function() { return 'recording'; }};
		relateTo.$gid0 = { val: function() { return recId; }};

		// Search for work title = recording title
		relateTo.$select.val('work');
		relateTo.autocomplete.$input.val(title);
		relateTo.autocomplete.searchAgain();

		console.debug(recId);
		console.debug(title);
	}

	this.settingsDialog = function() {
		document.forms.pweSettings.elements.fixRounded.checked = this.settings.fixRounded;
		document.getElementById('pwe-settings-panel').style.display = 'block';
	}

	this.settingsOk = function() {
		this.settings.fixRounded = document.forms.pweSettings.elements.fixRounded.checked;
		this.saveToStorage();
		this.settingsClose();
	}

	this.settingsClose = function() {
		document.getElementById('pwe-settings-panel').style.display = 'none';
	}

	this.releases = this.loadJSONArrayFromStorage('pwe_releases');
	this.groups = this.loadJSONArrayFromStorage('pwe_groups');
	this.people = this.loadJSONArrayFromStorage('pwe_people');
	this.settings = this.loadJSONObjectFromStorage('pwe_settings');

	this.addPowerEditorPanel();
	this.grabCurrentPageEntities();
	this.modifyPage();
}

// Trick to escape default userscripts scope into global window scope
var script = document.createElement('script');
script.appendChild(document.createTextNode('' + PowerEditor + '; window.pwe = new PowerEditor();'));
document.body.appendChild(script);
