(function() { /* Behaviors */
	var settings = {
		attributes: {
			behaviors: 'data-behavior',
			configuration: 'data-{name}-config'
		}
	}

	/**************************** Behavior Functionality ******************************/
	var __log = (!window.console || !window.console.log) ? function() {} : window.console.log;
	var __source = (!window.jQuery) ? {} : window.jQuery.fn;
	var __wired = false;

	if (!window.Element || !window.Element.prototype) {
		__log('ALERT: InteractionLib not enabled. Missing window.Element.prototype');
		return false;
	}

	/* Ensures a collection is an array */
	function toArray(collection) {
		var retarray = [];
		if (!collection) { return retarray; }
		if ('length' in collection) { for (var i = 0; i < collection.length; i++) { retarray.push(collection[i]); } }
		else { for (var i = 0; i in collection; i++) { retarray.push(collection[i]); } }
		return retarray;
	}
	/* Caches the length to "count" for performance as some collections re-evaluate for each call to .length */
	function countOf(collection) { collection._cachedCount = collection._cachedCount || collection.length; return collection._cachedCount; }

	function findAll(behavior, container) {
		container = container || window.document.body;
		if (!container || !container.querySelectorAll) { return []; }
		var selector = '[' + ((!behavior) ? settings.attributes.behaviors : settings.attributes.behaviors + '~=' + behavior) + ']';
		var containerMatches = (!behavior) || (container.getAttribute(settings.attributes.behaviors) || '').indexOf(new RegExp('\b' + behavior + '\b')) >= 0;
		var results = (!containerMatches) ? [] : [container];
		var finds = toArray(container.querySelectorAll(selector));
		for (var i = 0; i < countOf(finds); i++) { results.push(finds[i]); }
		return results;
	}

	function wireBehavior(behavior, element) {
		element[' applied-behaviors '] = element[' applied-behaviors '] || {};
		if (element[' applied-behaviors '][behavior]) { return false; }
		var func = __source[behavior];
		if (!func) { return false; }
		element[' applied-behaviors '][behavior] = true;
		var configAttr = settings.attributes.configuration.replace('{name}', behavior.toLowerCase());
		var config = element.getAttribute(configAttr);
		if (!config) { func.call(element); }
		else { func.call(element, JSON.parse(config)); }
		return true;
	}

	function wireElement(element) {
		var behaviors = (element.getAttribute(settings.attributes.behaviors) || '').split(/\s+/gi);
		if (!behaviors[0]) { return false; }
		for (var i = 0; i < countOf(behaviors); i++) { wireBehavior(behaviors[i], element); }
		return true;
	}

	function wireContainer(container, behavior) {
		var matches = findAll(behavior, container);
		for (var i = 0; i < countOf(matches); i++) {
			if (behavior) { wireBehavior(behavior, matches[i]); }
			else { wireElement(matches[i]); }
		}
	}

	window.Element.prototype.behaviors = function(name) {
		wireContainer(this, name);
	}

	window.Element.prototype.behaviors.add = function(name, behavior) {
		__source[name] = behavior;
		if (!__wired) { return; }
		wireContainer(false, name);
	}

	window.behaviors = window.Element.prototype.behaviors;

	/****************************************** DOM Watcher Wireups *****************************************/
	function useMutationObserver() {
		if (!window.MutationObserver) { return false; }
		var observer = new MutationObserver(function(mutations) {
			if (!mutations || !mutations[0]) { return; }
			for (var i = 0; i < countOf(mutations); i++) {
				var mutation = mutations[i];
				if (!mutation.addedNodes || !mutation.addedNodes[0]) { continue; }
				var nodes = toArray(mutation.addedNodes);
				for (var n = 0; n < countOf(nodes); n++) { wireContainer(nodes[n]); }
			}
		});
		observer.observe(window.document.body, { childList: true, subtree: true });
		return true;
	}

	function useMutationEvents() {
		var testResult = false;
		var testContainer = window.document.createElement('div');
		testContainer.addEventListener('DOMNodeInserted', function() { testResult = true; });
		testContainer.appendChild(window.document.createElement('div'));
		if (!testResult) { return false; }

		window.document.body.addEventListener('DOMNodeInserted', function(e) { wireContainer(e.target); });
		return true;
	}

	function useMutationWrap() { /* for IE8 only */
		if (!window.Element.prototype || !window.Element.prototype.attachEvent) { return false; }
		var append = window.Element.prototype.appendChild;
		window.Element.prototype.appendChild = function(node) {
			append.call(this, node);
			infestDOM([node]);
			wireContainer(node);
		}
		var prepend = window.Element.prototype.insertBefore;
		window.Element.prototype.insertBefore = function(node, mark) {
			prepend.call(this, node, mark);
			infestDOM([node]);
			wireContainer(node);
		}
		function infestDOM(nodes) { /* TODO: Add a disable for this */
			nodes = toArray(nodes);
			for (var i = 0; i < countOf(nodes); i++) {
				var node = nodes[i];
				if (!node.attachEvent) { continue; }
				node.attachEvent('onpropertychange', function(e) {
					var container = e.srcElement || e.target;
					if (e.propertyName !== 'innerHTML' || !container.childNodes) { return; }
					infestDOM(container.childNodes);
					wireContainer(container);
				});
			}
		}
		infestDOM([document]);
		return true;
	}

	function startDomWatcher() {
		var status = useMutationObserver() || useMutationEvents() || useMutationWrap();
		if (!status) { __log('ALERT: InteractionLib is not monitoring DOM mutations'); }
	}


	/**************************** Document Ready Wireups ******************************/
	var onready = [];
	window.behaviors.onready = function(callback) { if (__wired) { callback(); } else { onready.push(callback); } }
	function onDocumentReady() {
		if (!window.document.body) { return; }
		window.document.removeEventListener('DOMContentLoaded', onDocumentReady, false);
		window.removeEventListener('load', onDocumentReady, false);
		startDomWatcher();
		wireContainer();
		__wired = true;
		while (onready.length) { onready.shift()(); }
	}

	if (document.readyState === 'complete') { onDocumentReady(); }
	else {
		window.document.addEventListener('DOMContentLoaded', onDocumentReady, false);
		window.addEventListener('load', onDocumentReady, false);
	}
})();
