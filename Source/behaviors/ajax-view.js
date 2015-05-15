window.behaviors.add('ajax-view', function() {
   var container = this;
   var uri = container.getAttribute('href') || container.getAttribute('data-href');
   var ajax = new window.behaviors.extensions.ajax();
   ajax.send('get', uri, {}, function() {
      container.innerHTML = this.response;
   });
})
