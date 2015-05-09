window.behaviors.extensions = window.behaviors.extensions || {};
window.behaviors.extensions.toquery = function(obj) {
   var items = [];
   for (var member in obj) {
      var value = (typeof(obj[member]) === 'array') ? obj[member] : [obj[member]];
      for (var i = 0; i < value.length; i++) {
         items.push(encodeURIComponent(member) + '=' + encodeURIComponent(value[i]));
      }
   }
   return items.join('&');
}
