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

      var request = new window.behaviors.extensions.ajax();
      request.uri = form.getAttribute('action') || form.getAttribute(window.behaviors.ajax.form.attributes.action);
      request.method = (form.getAttribute('method') || form.getAttribute(window.behaviors.ajax.form.attributes.method) || 'POST');
      request.data = window.behaviors.extensions.serialize(form);
      request.query = window.behaviors.extensions.toquery(request.data);

      function sendEvent(response, event) {
         window.behaviors.extensions.trigger(targets, event, {
            form: form, action: request.uri, query: request.query, method: request.method,
            status: response.status,
            type: response.responseType,
            response: response.responseText
         });
      }

      request.onerror = function() { sendEvent(this, window.behaviors.ajax.form.events.failure); };
      request.onsuccess = function() { sendEvent(this, window.behaviors.ajax.form.events.success); };
      request.oncomplete = function() { sendEvent(this, window.behaviors.ajax.form.events.after); };

      var presubmit = { form: form, action: request.uri, query: request.query, method: request.method, cancel: false, resubmit: request.send };
      window.behaviors.extensions.trigger(targets, window.behaviors.ajax.form.events.before, presubmit);
      if (presubmit.cancel === true) { return; }

      request.send();
      return false;
   }
})();
