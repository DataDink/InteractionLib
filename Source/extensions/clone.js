window.behaviors.extensions.clone = function(obj, deep) {
   if (!deep) {
      var copy = {};
      for (var member in obj) { copy[member] = obj[member]; }
      return copy;
   } else {
      return JSON.parse(JSON.stringify(obj));
   }
};
