window.behaviors.add('ajax-nav', function() {
   var container = this;
   var links = window.behaviors.extensions.toarray(container.querySelectorAll('[href], [data-href]'));
   if (container.matches('[href], [data-href]')) { links.push(container); }
   var containerEvents = (container.getAttribute('data-nav-events') || 'click');

   for (var i = 0; i < links.length; i++) {
      (function(link) {
         function path() { return (window.location.hash || '').replace(/^[#\/]+|\?.*$/gi, '').replace(/\/+$/gi, '').toLowerCase(); }
         function route() { return (link.getAttribute('data-nav-route') || '').replace(/^[#\/]+|\?.*$/gi, '').replace(/\/+$/gi, '').toLowerCase(); }
         function navigate() {
            if (route() && path() !== route()) {
               window.location.hash = '/' + route();
               return;
            }
            var uri = link.getAttribute('href') || link.getAttribute('data-href');
            var targetSelector = link.getAttribute('target') || link.getAttribute('data-nav-target')
               || container.getAttribute('target') || container.getAttribute('data-nav-target');
            var targets = (!targetSelector) ? [link] : link.contextSelector(targetSelector);
            var ajax = new window.behaviors.extensions.ajax();
            ajax.send('get', uri, {}, function() {
               var response = new window.behaviors.ajax.event(this, link);
               window.behaviors.extensions.trigger(targets, window.behaviors.ajax.form.events.success, response);
            });
         }

         var events = (link.getAttribute('data-nav-events') || containerEvents).split(/\s+/gi);
         for (var e = 0; e < events.length; e++) {
            link.addEventListener(events[e], function(e) {
               e.returnValue = false;
               if (e.preventDefault) { e.preventDefault(); }
               if (e.stopPropagation) { e.stopPropagation(); }
               navigate();
               return false;
            });
         }

         if (route()) {
            function onroute() {
               if (!document.body.contains(link)) {
                  window.removeEventListener('hashchange', route);
                  return;
               }
               if (route() !== path()) { return; }
               navigate();
            }
            window.addEventListener('hashchange', onroute);
            onroute();
         }
      })(links[i]);
   }
})
