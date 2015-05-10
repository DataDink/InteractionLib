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
;

window.behaviors.extensions.appendquery = function(uri, query) {
   var join = uri.indexOf('?') >= 0 ? '&' : '?';
   return uri.replace(/[\/\s]+$/g, '') + join + query.replace(/^[\/\s&\?]+/g, '');
}
;

window.behaviors.extensions.appenduri = function(left, right) {
   return left.replace(/[\/\s]+$/g, '') + '/' + right.replace(/^[\/\s]+/g, '');
}
;

window.behaviors.extensions.clone = function(obj, deep) {
   if (!deep) {
      var copy = {};
      for (var member in obj) { copy[member] = obj[member]; }
      return copy;
   } else {
      return JSON.parse(JSON.stringify(obj));
   }
};
;

(function() {
	/***********************************************************************************/
	/*                      contextSelector Extension                                  */
	/*                                                                                 */
	/* Extends the DOM with the contextSelector method which allows a modified         */
	/* selector model over querySelector and querySelectorAll.                         */
	/*                                                                                 */
	/* Syntax: [context]>>[selector]                                                   */
	/*                                                                                 */
	/* Contexs:                                                                        */
	/*    'parent':   Selects a single matching parent of the current element.         */
	/*    'parents':  Selects all matching parents of the current element.             */
	/*    'child':    Selects a single matching child of the current element.          */
	/*    'children': Selects all matching children of the current element.            */
	/*    'next':     Selects a single matching sibling after the current element.     */
	/*    'nextAll':  Selects all matching siblings after the current element.         */
	/*    'prev':     Selects a single matching sibling before the current element.    */
	/*    'prevAll':  Selects all matching siblings before the current element.        */
	/*                                                                                 */
	/***********************************************************************************/

	var toarray = window.behaviors.extensions.toarray;

	function single(context, selector, itteration) {
		var relative = context[itteration];
		while (!!relative) {
			if (!!relative.matches && relative.matches(selector)) { return [relative]; }
			relative = relative[itteration];
		}
	}

	function multiple(context, selector, itteration) {
		var matches = [];
		var relative = context[itteration];
		while (!!relative) {
			if (!!relative.matches && relative.matches(selector)) { matches.push(relative); }
			relative = relative[itteration];
		}
		return matches;
	}

	function select(context, selector, single) {
		try {
			return single
				? [context.querySelector(selector)]
				: toarray(context.querySelectorAll(selector));
		} catch(error) { return []; }
	}

	function contextSelect(source, selector) {
		var parts = (selector || '').split('>>', 2), context = (parts[0] || '').replace(/\s+/g, '').toLowerCase(), query = (parts[1] || '');
		if (context === 'parent') { return single(source, query, 'parentNode'); }
		if (context === 'parents') { return multiple(source, query, 'parentNode'); }
		if (context === 'child') { return select(source, query, true); }
		if (context === 'children') { return select(source, query, false); }
		if (context === 'next') { return single(source, query, 'nextSibling'); }
		if (context === 'nextall') { return multiple(source, query, 'nextSibling'); }
		if (context === 'prev') { return single(source, query, 'previousSibling'); }
		if (context === 'prevall') { return multiple(source, query, 'previousSibling'); }
		return toarray(document.querySelectorAll(selector));
	}

	function wireExtension(context) {
		context.contextSelector = context.contextSelector
			|| function(selector) { return contextSelect(this, selector); };
	}
	wireExtension(window.Element.prototype);
	wireExtension(window.document);
})();
;

window.behaviors.extensions.is = function(value, type) {
   if (value && value.__proto__ && value.__proto__.constructor === type) { return true; }
   if (value && value.prototype && value.prototype.constructor === type) { return true; }
   if (value && value.constructor && value.constructor === type) { return true; }
   return ((typeof(value) || '').toString().toLowerCase() === (type || '').toString().toLowerCase());
};
;

(function() {
   var parser = document.createElement('div');
   window.behaviors.extensions.parse = function(html) {
      var content = [];
      parser.innerHTML = html;
      var content = window.behaviors.extensions.toarray(parser.childNodes);
      while (parser.firstChild) { parser.removeChild(parser.firstChild); }
      return content;
   };
})();
;

window.behaviors.extensions.serialize = function(form) {
   var inputs = window.behaviors.extensions.toarray(form.querySelectorAll('[name], [data-name]'));
   inputs.unshift(form);
   var values = {};
   for (var i = 0; i < inputs.length; i++) {
      var info = window.behaviors.extensions.values(inputs[i]);
      if (info === false) { continue; }
      if (!values[info.name]) { values[info.name] = info.values; }
      else { values[info.name] = values[info.name].concat(info.values); }
   }
   return values;
}
;

window.behaviors.extensions.toquery = function(obj) {
   var items = [];
   for (var member in obj) {
      var value = window.behaviors.extensions.is(obj[member], Array) ? obj[member] : [obj[member]];
      for (var i = 0; i < value.length; i++) {
         items.push(encodeURIComponent(member) + '=' + encodeURIComponent(value[i]));
      }
   }
   return items.join('&');
}
;

window.behaviors.extensions.trigger = function(elements, name, detail) {
   var evt = new CustomEvent(name, { bubbles: true, detail: detail });
   if (elements.dispatchEvent) { elements.dispatchEvent(evt); }
   else {
      elements = window.behaviors.extensions.toarray(elements);
      for (var i = 0; i < elements.length; i++) {
         elements[i].dispatchEvent(evt);
      }
   }
}
;

window.behaviors.extensions.values = function(input) {
   var name = input.getAttribute('name') || input.getAttribute('data-name');
   if (!name) { return false; }
   var values = [];
   if (input.matches('select')) {
      for (var i = 0; i < input.options.length; i++) {
         if (input.options[i].selected) { values.push(input.options[i].value); }
      }
   } else if (input.matches('input[type=checkbox]') || input.matches('input[type=radio]')) {
      if (!input.checked) { return false; }
      else { values.push(input.value); }
   } else if ('value' in input && input.value) {
      values.push(input.value);
   } else {
      values.push(input.getAttribute('data-value'));
   }
   return { name: name, values: values };
}
;

(function() {
   var trigger = window.behaviors.extensions.trigger;
   var serialize = window.behaviors.extensions.serialize;
   var appendquery = window.behaviors.extensions.appendquery;
   var toquery = window.behaviors.extensions.toquery;

   window.behaviors.ajax = window.behaviors.ajax || {};
   window.behaviors.ajax.form = {
      attributes: {
         action: 'data-action',
         method: 'data-method',
         target: 'data-target'
      },
      events: {
         before: 'ajax-before',
         success: 'ajax-success',
         failure: 'ajax-failure',
         after: 'ajax-after'
      }
   };
   window.behaviors.add('ajax-form', function() {
      this.addEventListener('submit', send, false);
      this.addEventListener(window.behaviors.ajax.submit.events.submit, send, false);
   });

   function send(e) {
      if (e.preventDefault) { e.preventDefault(); }
      if (e.stopPropagation) { e.stopPropagation(); }
      var form = this;
		var action = form.getAttribute('action') || form.getAttribute(window.behaviors.ajax.attributes.action);
		var method = (form.getAttribute('method') || form.getAttribute(window.behaviors.ajax.attributes.method) || 'POST').toUpperCase();
		var targetSelector = form.getAttribute('target') || form.getAttribute(window.behaviors.ajax.attributes.target);
		var targets = (!targetSelector) ? [form] : form.contextSelector(targetSelector);
		var query = toquery(serialize(form));
		var request = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();

      request.onreadystatechange = (function(response) { return function() {
			if (response.readyState !== 4) { return; }
			var isSuccess = response.status >= 200 && response.status < 300 || response.status === 304;

			if (!isSuccess) {
            trigger(targets, window.behaviors.ajax.events.failure, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			} else {
            trigger(targets, window.behaviors.ajax.events.success, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			}
         trigger(targets, window.behaviors.ajax.events.after, {
				form: form, action: action, query: query, method: method,
				status: response.status,
				type: response.responseType,
				response: response.responseText
			});
		};})(request);

		function submit() {
         var usebody = (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'UPDATE');
			request.open(method, ((!usebody) ? appendquery(action, query) : action), true);
			// TODO: This might cause a Preflight on CORS requests - see if we want to make that optional
			request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			if (usebody) {
				request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				request.send(query);
			} else {
				request.send();
			}
		};

      var presubmit = { form: form, action: action, query: query, method: method, cancel: false, resubmit: submit };
		trigger(targets, window.behaviors.ajax.events.before, presubmit);
		if (presubmit.cancel === true) { return; }

      submit();
   }
})();
;

(function() {
   window.behaviors.ajax = window.behaviors.ajax || {};
   window.behaviors.ajax.frame = {
      attributes: {
         listen: 'data-ajax-listen',
         target: 'data-ajax-target',
         mode: 'data-ajax-mode'
      },
      modes: {
         replaceContent: 'FILL',
         appendContent: 'APPEND',
         prependContent: 'PREPEND'
      }
   };

   window.behaviors.add('ajax-frame', function() {
      var coordinator = this;
      var sourceSelector = coordinator.getAttribute(window.behaviors.ajax.frame.attributes.listen);
      var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
      var targetSelector = coordinator.getAttribute(window.behaviors.ajax.frame.attributes.target);
      var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);
      var method = (coordinator.getAttribute(window.behaviors.ajax.frame.attributes.mode) || window.behaviors.ajax.frame.modes.replaceContent);

      var render = (function(targets, method) { return function(e) {
         var content = e.detail.response;
         for (var t = 0; t < targets.length; t++) {
            if (method === settings.modes.appendContent) { append(targets[t], content); }
            if (method === settings.modes.prependContent) { prepend(targets[t], content); }
            if (method === settings.modes.replaceContent) { replace(targets[t], content); }
         }
      };})(targets, method);

      for (var s = 0; s < sources.length; s++) {
         sources[s].addEventListener(settings.events.submitSuccess, render, false);
      }
   });

   function append(target, content) {
      content = window.behaviors.extensions.parse(content);
      for (var i = 0; i < content.length; i++) {
         target.appendChild(content[i]);
      }
   }

   function prepend(target, content) {
      var mark = target.firstChild;
      content = window.behaviors.extensions.parse(content);
      for (var i = 0; i < content.length; i++) {
         target.insertBefore(content[i], mark);
      }
   }

   function replace(target, content) {
      while (target.firstChild) { target.removeChild(target.firstChild); }
      append(target, content);
   }
})();
;

window.behaviors.ajax = window.behaviors.ajax || {};
window.behaviors.ajax.submit = {
   events: { submit: 'ajax-submit' },
   attributes: {
      events: 'data-ajax-events',
      listen: 'data-ajax-listen',
      target: 'data-ajax-target'
   }
};
window.behaviors.add('ajax-submit', function() {
   var coordinator = this;
   var events = (coordinator.getAttribute(window.behaviors.ajax.submit.attributes.events) || 'click').split(/\s+/gi);
   var sourceSelector = coordinator.getAttribute(window.behaviors.ajax.submit.attributes.listen);
   var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
   var targetSelector = coordinator.getAttribute(window.behaviors.ajax.submit.attributes.target);
   var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);

   var submit = (function(targets) { return function(e) {
      sendEvent(targets, window.behaviors.ajax.submit.events.submit, {});
   };})(targets);

   for (var s = 0; s < sources.length; s++) {
      for (var e = 0; e < events.length; e++) {
         sources[s].addEventListener(events[e], submit, false);
      }
   }
})
