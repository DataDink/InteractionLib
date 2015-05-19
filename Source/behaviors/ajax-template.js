(function(nothing) {
   function readMember(data, path) {
      var parts = (path || '').split('.');
      var member = parts.shift();
      if (!(member in data)) { return; }
      return readMember(data[member], parts.join('.');
   }

   function applyTemplate(template, data) {
      var values = template.match(/\{\{[^\{\}]+\}\}/gi);
      if (!values) { return template; }
      for (var i = 0; i < values.length; i++) {
         var path = values[i].replace(/^\{+|\}+$/gi, '');
         var value = readMember(data, path);
         if (!('toString' in value)) { value = ''; }
         template = template.replace(values[i], value.toString());
      }
      return template;
   }

   window.behaviors.add('ajax-template', function() {
      var container = this;
      var template = this.innerHTML;
      container.innerHTML = '';

      var listenSelector = container.getAttribute('data-template-listen') || false;
      var listen = !listenSelector ? [container] : container.contextSelector(listenSelector);
      var targetSelector = container.getAttribute('data-template-target') || false;
      var targets = !targetSelector ? [container] : container.contextSelector(targetSelector);

      for (var l = 0; l < listen.length; l++) {
         (function(source) { return function() {
            source.addEventListener('ajax-success', function(e) {
               var data = JSON.parse(e.detail.response);
               var content = '';
               if (data instanceof Array) {
                  for (var i = 0; i < data.length; i++) {
                     content = content + applyTemplate(template, data[i]);
                  }
               } else {
                  content = applyTemplate(template, data);
               }

               for (var t = 0; t < targets.length; t++) {
                  (function(target) { return function() {
                     target.innerHTML = content;
                  };})(targets[t]);
               }
            });
         };})(listen[l]);
      }
   });
})();
