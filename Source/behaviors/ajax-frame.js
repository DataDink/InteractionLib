(function() {
   window.behaviors.ajax = window.behaviors.ajax || {};
   window.behaviors.ajax.frame = {
      attributes: {
         listen: 'data-ajax-listen',
         target: 'data-ajax-target',
         mode: 'data-ajax-mode'
      },
      modes: {
         replaceContent: 'fill',
         appendContent: 'append',
         prependContent: 'prepend'
      }
   };

   window.behaviors.add('ajax-frame', function() {
      var coordinator = this;
      var sourceSelector = coordinator.getAttribute(window.behaviors.ajax.frame.attributes.listen);
      var sources = (!sourceSelector) ? [coordinator] : coordinator.contextSelector(sourceSelector);
      var targetSelector = coordinator.getAttribute(window.behaviors.ajax.frame.attributes.target);
      var targets = (!targetSelector) ? [coordinator] : coordinator.contextSelector(targetSelector);
      var method = (coordinator.getAttribute(window.behaviors.ajax.frame.attributes.mode) || window.behaviors.ajax.frame.modes.replaceContent).toLowerCase();

      var render = (function(targets, method) { return function(e) {
         var content = e.detail.response;
         for (var t = 0; t < targets.length; t++) {
            if (method === window.behaviors.ajax.frame.modes.appendContent) { append(targets[t], content); }
            if (method === window.behaviors.ajax.frame.modes.prependContent) { prepend(targets[t], content); }
            if (method === window.behaviors.ajax.frame.modes.replaceContent) { replace(targets[t], content); }
         }
      };})(targets, method);

      for (var s = 0; s < sources.length; s++) {
         sources[s].addEventListener(window.behaviors.ajax.form.events.success, render, false);
      }
   });

   function append(target, content) {
      content = window.behaviors.extensions.parse(content);
      for (var i = 0; i < content.length; i++) {
         target.appendChild(content[i]);
      }
   }

   function prepend(target, content) {
      var mark = target.firstChild;
      content = window.behaviors.extensions.parse(content);
      for (var i = 0; i < content.length; i++) {
         target.insertBefore(content[i], mark);
      }
   }

   function replace(target, content) {
      while (target.firstChild) { target.removeChild(target.firstChild); }
      append(target, content);
   }
})();
