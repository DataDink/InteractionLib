window.behaviors.extensions = window.behaviors.extensions || {};
window.behaviors.extensions.toarray = function(obj) {
   var arr = [];
   if ('length' in obj) {
      for (var i = 0; i < arr.length; i++) { arr.push[i]; } // fast
   } else {
      for (var i = 0; i in obj; i++) { arr.push(obj[i]); } // slow
   }
   return arr;
}
