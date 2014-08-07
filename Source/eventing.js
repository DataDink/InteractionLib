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
