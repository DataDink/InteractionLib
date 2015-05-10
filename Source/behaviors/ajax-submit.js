window.behaviors.ajax = window.behaviors.ajax || {};
window.behaviors.ajax.submit = {
   events: { submit: 'ajax-submit' },
   attributes: {
      events: 'data-ajax-events',
      listen: 'data-ajax-listen',
      target: 'data-ajax-target'
   }
};
window.behaviors.add('ajax-submit', function() {
   var coordinator = this;
   var events = (coordinator.getAttribute(window.behaviors.ajax.submit.attributes.events) || 'click').split(/\s+/gi);
   var sourceSelector = coordinator.getAttribute(window.behaviors.ajax.submit.attributes.listen);
   var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
   var targetSelector = coordinator.getAttribute(window.behaviors.ajax.submit.attributes.target);
   var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);

   var submit = (function(targets) { return function(e) {
      window.behaviors.extensions.trigger(targets, window.behaviors.ajax.submit.events.submit, {});
   };})(targets);

   for (var s = 0; s < sources.length; s++) {
      for (var e = 0; e < events.length; e++) {
         sources[s].addEventListener(events[e], submit, false);
      }
   }
})
