/* eventing.js */
(function() {
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
				var handlers = (this.customEventHandlers || {})[evt.type] || [];
				for (var i = 0; i < handlers.length; i++) { handlers[i].call(this, evt); }
				if (evt.bubbles && this.parentNode) { this.parentNode.dispatchEvent(evt); }
			};
			obj.addEventListener = (function(attach) { return function(type, handler, capture) {
				attach(type, handler, capture);
				this.customEventHandlers = this.customEventHandlers || {};
				this.customEventHandlers[type] = this.customEventHandlers[type] || [];
				this.customEventHandlers[type].push(handler);
			};})(obj.addEventListener);
			obj.removeEventListener = (function(detach) { return function(type, handler, capture) {
				detach(type, handler, capture);
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

/* behaviors.js */
(function() { /* Behaviors */
	var settings = {
		attributes: {
			behaviors: 'data-behavior',
			configuration: 'data-{name}-config'
		}
	}
	
	/**************************** Behavior Functionality ******************************/
	var __log = (!console || !console.log) ? function() {} : console.log;
	var __source = (!window.jQuery) ? {} : window.jQuery.fn;
	var __wired = false;
	
	if (!window.Element || !window.Element.prototype) {
		__log('ALERT: InteractionLib not enabled. Missing window.Element.prototype');
		return false;
	}
	
	function findAll(behavior, container) {
		container = container || window.document.body;
		var selector = '[' + ((!behavior) ? settings.attributes.behaviors : settings.attributes.behaviors + '~=' + behavior) + ']';
		var containerMatches = (!behavior) || container.getAttribute('data-behavior').indexOf(new RegExp('\b' + behavior + '\b')) >= 0;
		var results = (!containerMatches) ? [] : [container];
		var finds = container.querySelectorAll(selector);
		for (var i = 0; i < finds.length; i++) { results.push(finds[i]); }
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
		for (var i = 0; i < behaviors.length; i++) { wireBehavior(behaviors[i], element); }
		return true;
	}
	
	function wireContainer(container, behavior) {
		var matches = findAll(behavior, container);
		for (var i = 0; i < matches.length; i++) {
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
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (!mutation.addedNodes || !mutation.addedNodes[0]) { continue; }
				for (var n = 0; n < mutation.addedNodes.length; n++) { wireContainer(mutation.addedNodes[n]); }
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
	
	function useMutationWrap() { /* for IE only */
		var system = {
			appendChild: window.Element.prototype.appendChild,
			insertBefore: window.Element.prototype.insertBefore
		};
		window.Element.prototype.appendChild = function(node) {
			system.appendChild.call(this, node);
			wireContainer(node);
		};
		window.Element.prototype.insertBefore = function(node, mark) {
			system.insertBefore.call(this, node, mark);
			wireContainer(mark);
		};
		/* NOTE:	it is possible to use Object.defineProperty or 'onpropertychanged' to detect
					innerHTML mutations but this would need to be done per DOM element and will
					not be detected here. This should remain a known limitation */
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
})()
/* ajax.js */
(function($, undefined) {
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
			frameMode: 'data-ajax-mode'
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
		var value = input.value || input.getAttribute('value') || input.getAttribute('data-value');
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
	
	function appendQuery(action, query) {
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
		var targets = (!targetSelector) ? [form] : document.querySelectorAll(targetSelector);
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
	
	window.behaviors.add('ajax-frame', function() {
		var coordinator = this;
		var sourceSelector = coordinator.getAttribute(settings.attributes.frameListen);
		var sources = (!sourceSelector) ? [coordinator] : document.querySelectorAll(sourceSelector);
		var targetSelector = coordinator.getAttribute(settings.attributes.frameTarget);
		var targets = (!targetSelector) ? [coordinator] : document.querySelectorAll(targetSelector);
		var method = (coordinator.getAttribute(settings.attributes.frameMode) || settings.modes.replaceContent).toUpperCase();
		
		var render = (function(targets, method) { return function(e) {
			var html = new HtmlParse(e.detail.response);
			for (var t = 0; t < targets.length; t++) {
				var content = html.cloneNode(true);
				if (method === settings.modes.appendContent) { targets[t].appendChild(content); }
				if (method === settings.modes.prependContent) { targets[t].insertBefore(content, targets[t].firstChild); }
				if (method === settings.modes.replaceContent) { ClearChildren(targets[t]); targets[t].appendChild(content); }
			}
		};})(targets, method);
		
		for (var s = 0; s < sources.length; s++) {
			sources[s].addEventListener(settings.events.submitSuccess, render, false);
		}
	});
})(window.behaviors);



































