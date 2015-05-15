(function() {
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
   window.behaviors.ajax.event = function(response, element) {
      var event = this;
      event.action = response.uri;
      event.method = response.method;
      event.data = response.data;
      event.query = response.query;
      event.status = response.status;
      event.type = response.type;
      event.response = response.response;
      event.form = element;
   };

   window.behaviors.add('ajax-form', function() {
      this.addEventListener('submit', send, false);
      this.addEventListener(window.behaviors.ajax.submit.events.submit, send, false);
   });

   function send(e) {
      e.returnValue = false;
      if (e.preventDefault) { e.preventDefault(); }
      if (e.stopPropagation) { e.stopPropagation(); }
      var form = this;
      var targetSelector = form.getAttribute('target') || form.getAttribute(window.behaviors.ajax.form.attributes.target);
      var targets = (!targetSelector) ? [form] : form.contextSelector(targetSelector);

      var method = (form.getAttribute('method') || form.getAttribute(window.behaviors.ajax.form.attributes.method) || 'POST');
      var uri = form.getAttribute('action') || form.getAttribute(window.behaviors.ajax.form.attributes.action);
      var data = window.behaviors.extensions.serialize(form);
      var ajax = new window.behaviors.extensions.ajax();

      function sendEvent(response, event) {
         var detail = new window.behaviors.ajax.event(response, form);
         window.behaviors.extensions.trigger(targets, event, detail);
      }
      var send = function() { ajax.send(method, uri, data,
         function(e) { sendEvent(this, window.behaviors.ajax.form.events.success); },
         function(e) { sendEvent(this, window.behaviors.ajax.form.events.failure); },
         function(e) { sendEvent(this, window.behaviors.ajax.form.events.after); }
      );}

      var presubmit = new window.behaviors.ajax.event(
         {uri: uri, method: method, data: data, query: window.behaviors.extensions.toquery(data)},
         form
      );
      presubmit.cancel = false;
      presubmit.resubmit = send;

      window.behaviors.extensions.trigger(targets, window.behaviors.ajax.form.events.before, presubmit);
      if (presubmit.cancel === true) { return; }

      send();
      return false;
   }
})();
