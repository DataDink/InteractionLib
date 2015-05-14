window.behaviors.add('ajax-nav', function() {
   var container = this;
   var links = window.behaviors.extensions.toarray(container.querySelectorAll('[href], [data-href]'));
   if (container.matches('[href], [data-href]')) { links.push(container); }
   var event = container.getAttribute('data-nav-event') || 'click';

   for (var i = 0; i < links.length; i++) {
      links[i].addEventListener(event, (function(link) { return function(e) {
         e.returnValue = false;
         if (e.preventDefault) { e.preventDefault(); }
         if (e.stopPropagation) { e.stopPropagation(); }

         var uri = link.getAttribute('href') || link.getAttribute('data-href');
         var targetSelector = container.getAttribute('target') || container.getAttribute('data-nav-target');
         var targets = (!targetSelector) ? [link] : container.contextSelector(targetSelector);
         var request = new window.behaviors.extensions.ajax();
         request.uri = uri;
         request.onsuccess = function() {
            var submit = window.behaviors.ajax.form.events.success;
            var response = {
               form: link, method: 'get', uri: request.uri,
               status: this.status,
               type: this.responseType,
               response: this.responseText
            };
            for (var i = 0; i < targets.length; i++) {
               window.behaviors.extensions.trigger(targets[i], submit, response);
            }
         };
         request.send();
         return false;
      };})(links[i]));
   }
})
