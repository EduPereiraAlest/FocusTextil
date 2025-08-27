(() => {
    'use strict';
  
    const downloadButton = () => {
      return {
        scope: {},
        controller: downloadButtonController,
        replace: true,
        controllerAs: '$ctrl',
        bindToController: {
          model: '<'
        },
        templateUrl: 'app/books/directives/downloadButton.html'
      };
  
      function downloadButtonController(dataService, localService) {
        this.openLink = function() {
          let data = {
            MaterialCode: this.model.MaterialCode || this.model.Master.MaterialCode
          };
          
          window.open('/api/v1/ficha_tecnica?itens=' + data.MaterialCode, '_blank')

        };
      }
    };
  
    angular.module('app').directive('downloadButton', downloadButton);
  })();
  