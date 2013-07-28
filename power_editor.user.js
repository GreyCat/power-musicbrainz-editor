// ==UserScript==
// @name          MusicBrainz power editor
// @description   Provide power editor tools for quick massive editing in MusicBrainz
// @include       http://musicbrainz.org/*
// @match         http://musicbrainz.org/*
// ==/UserScript==

function power_editor_injection() {
	var releases;
	var groups;
	var people;

	function add_power_editor_panel() {
		// Add styles
		var styles = document.createElement('style');
		styles.innerHTML = '#pwe-panel { width: 30em; float: left; padding-right: 1em; border-right: 1px solid black; background: white; z-index: 50; };'

		// Add panel
		var panel = document.createElement('div');
		panel.setAttribute('id', 'pwe-panel');

		panel.innerHTML = '<h1>Power editor</h1>' +
			'<h2>Music</h2>' +
			'<div id="pwe-release"></div>' +
			'<h2>Group</h2>' +
			'<div id="pwe-group"></div>' +
			'<h2>People</h2>' +
			'<div id="pwe-people"></div>';

		var header = document.getElementById('header');

		document.body.insertBefore(styles, header);
		document.body.insertBefore(panel, header);

		update_releases();
	}

	function load_from_storage() {
		var rStr = localStorage['pwe_releases'];
		if (rStr) {
			releases = JSON.parse(rStr);
		} else {
			releases = [];
		}
	}

	function save_to_storage() {
		localStorage['pwe_releases'] = JSON.stringify(releases);
	}

	function update_releases() {
		var str = '\n<ul>\n';
		for (var i = 0; i < releases.length; i++) {
			str += '<li><a href="xxx">' + releases[i].title + '</a></li>\n';
		}
		str += '</ul>\n';

		var listDiv = document.getElementById('pwe-release');
		listDiv.innerHTML = str;
	}

	function memorize_release(title, id) {
		// Check if it already exists
		for (var i = 0; i < releases.length; i++) {
		}
		update_releases();
	}

	function grab_current_page_entities() {
		var content = document.getElementById('content');
		if (content.children[0].className == 'releaseheader') {
			// Release page
			
		}
	}

	load_from_storage();
	add_power_editor_panel();
	grab_current_page_entities();
}

power_editor_injection();
