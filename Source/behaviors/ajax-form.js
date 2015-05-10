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
      var action = form.getAttribute('action') || form.getAttribute(window.behaviors.ajax.form.attributes.action);
      var method = (form.getAttribute('method') || form.getAttribute(window.behaviors.ajax.form.attributes.method) || 'POST').toUpperCase();
      var targetSelector = form.getAttribute('target') || form.getAttribute(window.behaviors.ajax.form.attributes.target);
      var targets = (!targetSelector) ? [form] : form.contextSelector(targetSelector);
      var query = toquery(serialize(form));
      var request = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();

      request.onreadystatechange = (function(response) { return function() {
         if (response.readyState !== 4) { return; }
         var isSuccess = response.status >= 200 && response.status < 300 || response.status === 304;

         if (!isSuccess) {
            trigger(targets, window.behaviors.ajax.form.events.failure, {
               form: form, action: action, query: query, method: method,
               status: response.status,
               type: response.responseType,
               response: response.responseText
            });
         } else {
            trigger(targets, window.behaviors.ajax.form.events.success, {
               form: form, action: action, query: query, method: method,
               status: response.status,
               type: response.responseType,
               response: response.responseText
            });
         }
         trigger(targets, window.behaviors.ajax.form.events.after, {
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
      trigger(targets, window.behaviors.ajax.form.events.before, presubmit);
      if (presubmit.cancel === true) { return; }

      submit();
      return false;
   }
})();
