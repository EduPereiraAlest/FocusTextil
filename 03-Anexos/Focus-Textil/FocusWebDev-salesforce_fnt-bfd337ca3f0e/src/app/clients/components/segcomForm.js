(function() {
  'use strict';

  angular.module('app').directive('segcomForm', segcomForm);

  function segcomForm() {
    return {
      replace: true,
      templateUrl: 'app/clients/components/segcomForm.html',
      controller: segcomFormController,
      controllerAs: '$ctrl',
      bindToController: {
        model: '='
      }
    };

    function segcomFormController($scope, $timeout) {
      this.checkbox = {};

      $timeout(() => {
        for (let key in this.model) {
          if (this.model.hasOwnProperty(key)) {
            this.checkbox[key] = true;
          }
        }
      });

      $scope.$watch(
        '$ctrl.checkbox',
        checkbox => {
          if (Object.keys(checkbox).length) {
            let model = {};

            for (let key in checkbox) {
              if (checkbox.hasOwnProperty(key) && checkbox[key]) {
                model[key] = this.model[key] || true;
              }
            }
            this.model = { ...model };
          }
        },
        true
      );
    }
  }
})();
