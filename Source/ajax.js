(function($, undefined) {
	var settings = {
		events: {
			beforeSubmit: 'ajax-before',
			submitSuccess: 'ajax-success',
			submitFailure: 'ajax-failure',
			afterSubmit: 'ajax-after',
			triggerSubmit: 'ajax-submit',
		}
	}
	
	/**************************** Helpers **************************/
	function sendEvent(element, name, detail) {
		var evt = new CustomEvent(name, { bubbles: true, detail: detail });
		element.dispatchEvent(evt);
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
		var action = form.getAttribute('action') || form.getAttribute('data-action');
		var method = (form.getAttribute('method') || form.getAttribute('data-method') || 'POST').toUpperCase();
		var query = formatQuery(serializeForm(form));
		var request = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
		request.onreadystatechange = (function(response) { return function() {
			if (response.readyState !== 4) { return; }
			if (response.status >= 500 && response.status < 600) {
				sendEvent(form, settings.events.submitFailure, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			} else {
				sendEvent(form, settings.events.submitSuccess, {
					form: form, action: action, query: query, method: method,
					status: response.status,
					type: response.responseType,
					response: response.responseText
				});
			}
			sendEvent(form, settings.events.afterSubmit, {
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
		sendEvent(form, settings.events.beforeSubmit, presubmit);
		if (presubmit.cancel) { return; }
		
		send();
	}
	
	window.behaviors.add('ajax-form', function() {
		this.addEventListener('submit', submithandler, false);
		this.addEventListener('ajax-submit', submithandler, false);
	});
	
})(window.behaviors);