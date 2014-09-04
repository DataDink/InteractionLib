/************eventing.js************/
(function() {
	function clone(obj) { var dupe = {}; for (var p in obj) { dupe[p] = obj[p]; } return dupe; }
	
	function setEventingPolyfills(obj) {
		obj.addEventListener = obj.addEventListener || function(name, handler) { this.attachEvent('on' + name, handler); };
		obj.removeEventListener = obj.removeEventListener || function(name, handler) { this.detachEvent('on' + name, handler); };
	}
	setEventingPolyfills(window.Element.prototype);
	setEventingPolyfills(window.document);
	setEventingPolyfills(window);
	
	function setDispatchPolyfills(obj) { /* this is IE8 only */
		if (!obj.dispatchEvent) {
			obj.dispatchEvent = function(evt) {
				if (!evt.target) { evt = clone(evt); evt.target = this; }
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

/************contextSelector.js************/
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
	
	function wirePolyfill(context) {
		context.matchesSelector = context.matchesSelector
			|| context.webkitMatchesSelector
			|| context.mozMatchesSelector
			|| context.msMatchesSelector
			|| context.oMatchesSelector
			|| function(selector) {
				var container = this.parent || document, matches = container.querySelectorAll(selector), i = -1;
				while(matches[++i] && matches[i] != this);
				return !!matches[i];
			};
	}
	wirePolyfill(window.Element.prototype);
	wirePolyfill(window.document);
	
	function toArray(collection) { return !collection ? [] : Array.prototype.slice.call(collection, 0); }
	
	function single(context, selector, itteration) {
		var relative = context[itteration];
		while (!!relative) { 
			if (!!relative.matchesSelector && relative.matchesSelector(selector)) { return [relative]; }
			relative = relative[itteration];
		}
	}
	
	function multiple(context, selector, itteration) {
		var matches = [];
		var relative = context[itteration];
		while (!!relative) { 
			if (!!relative.matchesSelector && relative.matchesSelector(selector)) { matches.push(relative); } 
			relative = relative[itteration];		
		}
		return matches;
	}
	
	function select(context, selector, single) {
		var results = toArray(context.querySelectorAll(selector));
		if (!single) { return results; }
		if (results.length === 0) { return results; }
		return [results[0]];
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
		return toArray(document.querySelectorAll(selector));
	}
	
	function wireExtension(context) {
		context.contextSelector = context.contextSelector
			|| function(selector) { return contextSelect(this, selector); };
	}
	wireExtension(window.Element.prototype);
	wireExtension(window.document);
})();

/************behaviors.js************/
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
	function toArray(collection) { return !collection ? [] : Array.prototype.slice.call(collection, 0); }
	/* Caches the length to "count" for performance as some collections re-evaluate for each call to .length */
	function countOf(collection) { collection._cachedCount = collection._cachedCount || collection.length; return collection._cachedCount; } 
	
	function findAll(behavior, container) {
		container = container || window.document.body;
		if (!container || !container.querySelectorAll) { return []; }
		var selector = '[' + ((!behavior) ? settings.attributes.behaviors : settings.attributes.behaviors + '~=' + behavior) + ']';
		var containerMatches = (!behavior) || container.getAttribute('data-behavior').indexOf(new RegExp('\b' + behavior + '\b')) >= 0;
		var results = (!containerMatches) ? [] : [container];
		var finds = toArray(container.querySelectorAll(selector));
		for (var i = 0; i < countOf(finds); i++) { results.push(finds[i]); }
		return results;
	}
	
	function wireBehavior(behavior, element) {
		element['applied-behaviors'] = element['applied-behaviors'] || {};
		if (element['applied-behaviors'][behavior]) { return false; }
		element['applied-behaviors'][behavior] = true;
		var func = __source[behavior];
		if (!func) { return false; }
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
			if (behavior) { wireBehavior(name, matches[i]); }
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
	function onDocumentReady() {
		if (!window.document.body) { return; }
		window.document.removeEventListener('DOMContentLoaded', onDocumentReady, false);
		window.removeEventListener('load', onDocumentReady, false);
		startDomWatcher();
		wireContainer();
		__wired = true;
	}
	
	if (document.readyState === 'complete') { onDocumentReady(); }
	else {
		window.document.addEventListener('DOMContentLoaded', onDocumentReady, false);
		window.addEventListener('load', onDocumentReady, false);
	}
})(); 
/************ajax.js************/
(function() {
	var settings = {
		events: {
			beforeSubmit: 'ajax-before',
			submitSuccess: 'ajax-success',
			submitFailure: 'ajax-failure',
			afterSubmit: 'ajax-after',
			triggerSubmit: 'ajax-submit'
		},
		attributes: {
			formAction: 'data-action',
			formMethod: 'data-method',
			formTarget: 'data-target',
			
			frameListen: 'data-ajax-listen',
			frameTarget: 'data-ajax-target',
			frameMode: 'data-ajax-mode',
			
			submitListen: 'data-ajax-listen',
			submitTarget: 'data-ajax-target',
			submitEvents: 'data-ajax-events'
		},
		modes: {
			replaceContent: 'FILL',
			appendContent: 'APPEND',
			prependContent: 'PREPEND'
		}
	}
	
	/**************************** Helpers **************************/
	function sendEvent(elementCollection, name, detail) {
		var evt = new CustomEvent(name, { bubbles: true, detail: detail });
		for (var i = 0; i < elementCollection.length; i++) { elementCollection[i].dispatchEvent(evt); }
	}
	
	/**************************** ajax-form ***************************/
	function serializeInput(input) {
		var name = input.getAttribute('name') || input.getAttribute('data-name');
		if (!name) { return false; }
		var isInput = (input.tagName || '').toLowerCase() === 'input';
		var isCheck = isInput && input.getAttribute('type').toLowerCase() === 'checkbox';
		var isRadio = isInput && input.getAttribute('type').toLowerCase() === 'radio';
		if ((isCheck || isRadio) && !input.checked) { return false; }
		var value = ('value' in input ? input.value : input.getAttribute('value') || input.getAttribute('data-value')) || '';
		return {name: name, value: value};
	}
	
	function serializeForm(form) {
		var values = {};
		var formValue = serializeInput(form);
		if (formValue) { values[formValue.name] = formValue.value; }
		var inputs = form.querySelectorAll('[name], [data-name]');
		for (var i = 0; i < inputs.length; i++) {
			var value = serializeInput(inputs[i]);
			if (value.name in values) { continue; }
			values[value.name] = value.value;
		}
		return values;
	}
	
	function formatQuery(queryValues) {
		var query = [];
		for (var name in queryValues) {
			query.push(name + '=' + encodeURIComponent(queryValues[name]));
		}
		return query.join('&');
	}
	
	function appendUrl(action, query) {
		if (action.indexOf('?') < 0) { action += '?'; }
		else { action += '&'; }
		return action + query;
	}
	
	function submithandler(e) {
		if (e.preventDefault) { e.preventDefault(); }
		var form = this;
		var action = form.getAttribute('action') || form.getAttribute(settings.attributes.formAction);
		var method = (form.getAttribute('method') || form.getAttribute(settings.attributes.formMethod) || 'POST').toUpperCase();
		var targetSelector = form.getAttribute('target') || form.getAttribute(settings.attributes.formTarget);
		var targets = (!targetSelector) ? [form] : form.contextSelector(targetSelector);
		var query = formatQuery(serializeForm(form));
		var request = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
		request.onreadystatechange = (function(response) { return function() {
			if (response.readyState !== 4) { return; }
			if (response.status >= 500 && response.status < 600) {
				sendEvent(targets, settings.events.submitFailure, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			} else {
				sendEvent(targets, settings.events.submitSuccess, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			}
			sendEvent(targets, settings.events.afterSubmit, {
				form: form, action: action, query: query, method: method,
				status: response.status,
				type: response.responseType,
				response: response.responseText
			});
		};})(request);
		
		function send() {
			var url = (method === 'GET') ? appendUrl(action, query) : action;
			request.open(method, url, true);
			if (method === 'POST') {
				request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				request.send(query);
			} else {
				request.send();
			}
		};
		
		var presubmit = { form: form, action: action, query: query, method: method, cancel: false, resubmit: send };
		sendEvent(targets, settings.events.beforeSubmit, presubmit);
		if (presubmit.cancel) { return; }
		
		send();
	}
	
	window.behaviors.add('ajax-form', function() {
		this.addEventListener('submit', submithandler, false);
		this.addEventListener('ajax-submit', submithandler, false);
	});
	
	/**************************** ajax-frame ***************************/
	function HtmlParse(raw) {
		var container = document.createElement('div');
		container.innerHTML = raw; /* TODO: Research better parsing options */
		return container;
	}
	
	function ClearChildren(node) {
		while (node.firstChild) { node.removeChild(node.firstChild); }
	}
	
	function AppendContent(from, to) {
		while (from.firstChild) { to.appendChild(from.firstChild); }
	}
	
	function PrependContent(from, to) {
		var mark = to.firstChild;
		while (from.firstChild) { to.insertBefore(from.firstChild, mark); }
	}
	
	window.behaviors.add('ajax-frame', function() {
		var coordinator = this;
		var sourceSelector = coordinator.getAttribute(settings.attributes.frameListen);
		var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
		var targetSelector = coordinator.getAttribute(settings.attributes.frameTarget);
		var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);
		var method = (coordinator.getAttribute(settings.attributes.frameMode) || settings.modes.replaceContent).toUpperCase();
		
		var render = (function(targets, method) { return function(e) {
			var html = new HtmlParse(e.detail.response);
			for (var t = 0; t < targets.length; t++) {
				var content = html.cloneNode(true);
				if (method === settings.modes.appendContent) { AppendContent(content, targets[t]); }
				if (method === settings.modes.prependContent) { PrependContent(content, targets[t]); }
				if (method === settings.modes.replaceContent) { ClearChildren(targets[t]); AppendContent(content, targets[t]); }
			}
		};})(targets, method);
		
		for (var s = 0; s < sources.length; s++) {
			sources[s].addEventListener(settings.events.submitSuccess, render, false);
		}
	});
	
	/**************************** ajax-submit ***************************/
	window.behaviors.add('ajax-submit', function() {
		var coordinator = this;
		var events = (coordinator.getAttribute(settings.attributes.submitEvents) || 'click').split(/\s+/gi);
		var sourceSelector = coordinator.getAttribute(settings.attributes.submitListen);
		var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
		var targetSelector = coordinator.getAttribute(settings.attributes.submitTarget);
		var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);
		
		var submit = (function(targets) { return function(e) {
			sendEvent(targets, settings.events.triggerSubmit, {});
		};})(targets);
		
		for (var s = 0; s < sources.length; s++) {
			for (var e = 0; e < events.length; e++) {
				sources[s].addEventListener(events[e], submit, false);
			}
		}
	});
})();




































