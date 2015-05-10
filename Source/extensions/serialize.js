window.behaviors.extensions.serialize = function(form) {
   var inputs = window.behaviors.extensions.toarray(form.querySelectorAll('[name], [data-name]'));
   input.unshift(form);
   var values = {};
   for (var i = 0; i < inputs.length; i++) {
      var info = window.behaviors.extensions.values(inputs[i]);
      if (info === false) { continue; }
      if (!values[info.name]) { values[info.name] = info.values; }
      else { values[info.name] = values[info.name].concat(info.values); }
   }
   return values;
}
