(function() {
  'use strict';

  angular.module('app').directive('sugestForm', sugestForm);

  function sugestForm() {
    return {
      scope: true,
      replace: true,
      templateUrl: 'app/clients/components/sugestForm.html',
      controller: sugestFormController,
      controllerAs: '$ctrl',
      bindToController: {
        model: '=',
        formCtrl: '<'
      }
    };

    function sugestFormController() {}
  }
})();
