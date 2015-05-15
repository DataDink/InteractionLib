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
         var ajax = new window.behaviors.extensions.ajax();
         ajax.send('get', uri, {}, function() {
            var response = new window.behaviors.ajax.event(this, link);
            window.behaviors.extensions.trigger(targets, window.behaviors.ajax.form.events.success, response);
         });
         return false;
      };})(links[i]));
   }
})
