(function() {
  'use strict';

  angular.module('app').directive('inputText', inputText);

  function inputText() {
    return {
      replace: true,
      scope: {
        model: '=',
        label: '@',
        name: '@',
        classes: '@',
        disabled: '@',
        required: '@'
      },
      link: link,
      templateUrl: 'app/clients/directives/inputText.html'
    };

    function link() {
      this.style = 'form-group ' + this.classes;
    }
  }
})();
