window.behaviors.add('ajax-nav', function() {
   var container = this;
   var event = container.getAttribute('data-nav-event') || 'click';
   container.addEventListener(event, function(e) {
      if (e.preventDefault) { e.preventDefault(); }
      if (e.stopPropagation) { e.stopPropagation(); }
      var uri = container.getAttribute('href') || container.getAttribute('data-href');
      var targetSelector = container.getAttribute('target') || container.getAttribute('data-nav-target');
      var targets = (!targetSelector) ? [container] : container.contextSelector(targetSelector);
      var request = new window.behaviors.extensions.ajax();
      request.uri = uri;
      request.onsuccess = function() {
         var submit = window.behaviors.ajax.submit.events.submit;
         var response = {
            form: container, method: 'get', uri: request.uri,
            status: this.status,
            type: this.responseType,
            response: this.responseText
         };
         for (var i = 0; i < targets.length; i++) {
            window.behaviors.extensions.trigger(targets[i], submit, response);
         }
      };
      request.send();
   })
})
