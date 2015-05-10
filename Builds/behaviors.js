function setEventingPolyfills(obj) {
   obj.addEventListener = obj.addEventListener || function(name, handler) { this.attachEvent('on' + name, handler); };
   obj.removeEventListener = obj.removeEventListener || function(name, handler) { this.detachEvent('on' + name, handler); };
}
setEventingPolyfills(window.Element.prototype);
setEventingPolyfills(window.document);
setEventingPolyfills(window);
;

(function() {
	function setDispatchPolyfills(obj) { /* this is IE8 only */
		if (!obj.dispatchEvent) {
			obj.dispatchEvent = function(evt) {
				var clone = {}; for (var m in evt) { clone[m] = evt[m]; };
				if (!evt.target) { evt = clone; evt.target = this; }
				evt.currentTarget = this;
				var handlers = (this.customEventHandlers || {})[evt.type] || [];
				for (var i = 0; i < handlers.length; i++) { handlers[i].call(this, evt); }
				if (evt.bubbles && this.parentNode) { this.parentNode.dispatchEvent(evt); }
			};
			obj.addEventListener = (function(attach) { return function(type, handler, capture) {
				attach.call(this, type, handler, capture);
				this.customEventHandlers = this.customEventHandlers || {};
				this.customEventHandlers[type] = this.customEventHandlers[type] || [];
				this.customEventHandlers[type].push(handler);
			};})(obj.addEventListener);
			obj.removeEventListener = (function(detach) { return function(type, handler, capture) {
				detach.call(this, type, handler, capture);
				if (!this.customEventHandlers || !this.customEventHandlers[type]) { return; }
				for (var i = this.customEventHandlers[type].length - 1; i >= 0; i--) {
					if (this.customEventHandlers[type][i] === handler) {
						this.customEventHandlers[type].splice(i, 1);
					}
				}
			};})(obj.removeEventListener);
		}
	}
	setDispatchPolyfills(window.Element.prototype);
	setDispatchPolyfills(window.document);
	setDispatchPolyfills(window);

	window.CustomEvent = (typeof(window.CustomEvent) === 'function') ? window.CustomEvent : function(name, params) {
		params = params || { bubbles: false, cancelable: false };
		if (window.document.createEvent) {
			var evt = document.createEvent('Event');
			evt.detail = params.detail;
			evt.initEvent(name, params.bubbles, params.cancelable);
			return evt;
		}
		if (window.document.createEventObject) {
			var evt = window.document.createEventObject(window.event);
			evt.type = name;
			evt.detail = params.detail;
			evt.bubbles = params.bubbles;
			evt.cancelable = params.cancelable;
			return evt;
		}
	}
})();
;

(function() {
   var staparent = document.createElement('div');
   function wirePolyfill(context) {
      context.matches = context.matches
         || context.matchesSelector
			|| context.webkitMatchesSelector
			|| context.mozMatchesSelector
			|| context.msMatchesSelector
			|| context.oMatchesSelector
			|| function(selector) {
            var rigparent = !this.parent, container = (rigparent ? staparent : this.parent);
            if (rigparent) { staparent.appendChild(this); }
            var matches = container.querySelectorAll(selector), i = -1;
				while(matches[++i] && matches[i] != this);
            if (rigparent) { staparent.removeChild(this); }
				return !!matches[i];
			};
	}
	wirePolyfill(window.Element.prototype);
	wirePolyfill(window.document);
})();
;

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

	/* Caches the length to "count" for performance as some collections re-evaluate for each call to .length */
	function countOf(collection) { collection._cachedCount = collection._cachedCount || collection.length; return collection._cachedCount; }

	function findAll(behavior, container) {
		container = container || window.document.body;
		if (!container || !container.querySelectorAll) { return []; }
		var selector = '[' + ((!behavior) ? settings.attributes.behaviors : settings.attributes.behaviors + '~=' + behavior) + ']';
		var containerMatches = (!behavior) || (container.getAttribute(settings.attributes.behaviors) || '').indexOf(new RegExp('\b' + behavior + '\b')) >= 0;
		var results = (!containerMatches) ? [] : [container];
		var finds = window.behaviors.extensions.toarray(container.querySelectorAll(selector));
		for (var i = 0; i < countOf(finds); i++) { results.push(finds[i]); }
		return results;
	}

	function wireBehavior(behavior, element) {
		if (document.body && document.body.contains && !document.body.contains(element)) { return; }
		element[' applied-behaviors '] = element[' applied-behaviors '] || {};
		if (element[' applied-behaviors '][behavior]) { return false; }
		var func = __source[behavior];
		if (!func) { return false; }
		element[' applied-behaviors '][behavior] = true;
		var configAttr = settings.attributes.configuration.replace('{name}', behavior.toLowerCase());
		var config = element.getAttribute(configAttr);
		if (!config) { func.call(element); }
		else { func.call(element, window.behaviors.extensions.jsonish(config)); }
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

	/****************************************** extensions ***************************************************/
	window.behaviors.extensions = {};
	window.behaviors.extensions.toarray = function(obj) {
	   var arr = [];
		if (!obj) { return arr; }
	   if ('length' in obj) { for (var i = 0; i < obj.length; i++) { arr.push(obj[i]); } } // faster
		else { for (var i = 0; i in obj; i++) { arr.push(obj[i]); } } // slower
	   return arr;
	};

	/****************************************** jsonish ******************************************************/
	window.behaviors.extensions.jsonish = function(str) { return readvalue({buff: str}); };

	function readvalue(data) {
		if (data.buff.match(/^\s*('|")/g)) { return readstring(data); }
		if (data.buff.match(/^\s*\d+/g)) { return readnumber(data); }
		if (data.buff.match(/^\s*(true|false)\b/gi)) { return readbool(data); }
		if (data.buff.match(/^\s*\[/g)) { return readarray(data); }
		if (data.buff.match(/^\s*\{/g)) { return readobj(data); }
	}

	function isescaped(str, at) {
		var count = 0;
		while (--at >= 0 && str[at] === '\\') { count++; }
		return (count % 2) !== 0;
	}

	function readstring(data) {
		var at = -1;
		data.buff = data.buff.replace(/^\s+/g, '');
		var delim = data.buff[0];
		data.buff = data.buff.substr(1);
		while (++at < data.buff.length && data.buff[at] !== delim || isescaped(data.buff, at)) {}
		var value = data.buff.substring(0, at);
		data.buff = data.buff.substr(at + 1);
		return value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	function readnumber(data) {
		var str = data.buff.match(/^\s*\d+(\.\d+)?/g)[0];
		data.buff = data.buff.substr(str.length);
		return parseFloat(str.replace(/^\s+/g, ''));
	}

	function readbool(data) {
		var str = data.buff.match(/^\s*(true|false)/gi)[0];
		data.buff = data.buff.substr(str.length);
		return str.toLowerCase().indexOf('true') >= 0;
	}

	function readarray(data) {
		var arr = [];
		data.buff = data.buff.replace(/^\s*\[/, '');
		if (data.buff.match(/^\s*\]/g)) {
			data.buff = data.buff.replace(/^\s*\]/g, '');
			return arr;
		}
		do {
			data.buff = data.buff.replace(/^\s*,/g, '');
			arr.push(readvalue(data));
		} while(data.buff.match(/^\s*,/g));
		data.buff = data.buff.replace(/^\s*\]/g, '');
		return arr;
	}

	function readname(data) {
		var value = data.buff.match(/^\s*('|")/g) ? readstring(data) : false;
		if (value === false) {
			value = data.buff.match(/^\s*[^:\s]+/g)[0];
			data.buff = data.buff.substr(value.length);
			value = value.replace(/^\s+/g, '');
		}
		data.buff = data.buff.replace(/^\s*:/g, '');
		return value;
	}

	function readobj(data) {
		var obj = {};
		data.buff = data.buff.replace(/^\s*\{/g, '');
		if (data.buff.match(/^\s*\}/g)) {
			data.buff = data.buff.replace(/^\s*\}/g, '');
			return obj;
		}
		do {
			data.buff = data.buff.replace(/^\s*,/g, '');
			var name = readname(data);
			var value = readvalue(data);
			obj[name] = value;
		} while (data.buff.match(/^\s*,/g));
		data.buff = data.buff.replace(/^\s*\}/g, '');
		return obj;
	}


	/****************************************** DOM Watcher Wireups *****************************************/
	function useMutationObserver() {
		if (!window.MutationObserver) { return false; }
		var observer = new MutationObserver(function(mutations) {
			if (!mutations || !mutations[0]) { return; }
			for (var i = 0; i < countOf(mutations); i++) {
				var mutation = mutations[i];
				if (!mutation.addedNodes || !mutation.addedNodes[0]) { continue; }
				var nodes = window.behaviors.extensions.toarray(mutation.addedNodes);
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
			nodes = window.behaviors.extensions.toarray(nodes);
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
