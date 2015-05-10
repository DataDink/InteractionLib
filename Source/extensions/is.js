window.behaviors.extensions.is = function(value, type) {
   if (value && value.__proto__ && value.__proto__.constructor === type) { return true; }
   if (value && value.prototype && value.prototype.constructor === type) { return true; }
   if (value && value.constructor && value.constructor === type) { return true; }
   return ((typeof(value) || '').toString().toLowerCase() === (type || '').toString().toLowerCase());
};
