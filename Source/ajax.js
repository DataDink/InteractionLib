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
		var value = input.value || input.getAttribute('value') || input.getAttribute('data-value');
		return {name: name, value: value};
	}
	
	function serializeForm(form) {
		var values = {};
		var formValue = serializeInput(form);
		if (formValue) { values[formValue.name] = formValue.value; }
		var inputs = form.contextSelectorAll('[name], [data-name]');
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
		var targets = (!targetSelector) ? [form] : form.contextSelectorAll(targetSelector);
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
		var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelectorAll(sourceSelector);
		var targetSelector = coordinator.getAttribute(settings.attributes.frameTarget);
		var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelectorAll(targetSelector);
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
		var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelectorAll(sourceSelector);
		var targetSelector = coordinator.getAttribute(settings.attributes.submitTarget);
		var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelectorAll(targetSelector);
		
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



































