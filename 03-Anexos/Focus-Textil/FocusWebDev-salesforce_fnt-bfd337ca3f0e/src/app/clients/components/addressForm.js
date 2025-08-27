(function() {
  'use strict';

  angular.module('app').directive('addressForm', addressForm);

  function addressForm() {
    return {
      scope: true,
      replace: true,
      transclude: true,
      templateUrl: 'app/clients/components/addressForm.html',
      controller: addressFormController,
      controllerAs: '$ctrl',
      bindToController: {
        model: '=',
        formCtrl: '<',
        title: '@',
        type: '@',
        disabled: '@'
      }
    };

    function addressFormController($timeout, dataService) {
      this.isInscEstAdrCliValid = false

      this.$onInit = function() {
        if(this.model.InscEstAdrCli) {
          this.validateIE(this.model.InscEstAdrCli.replace(/[.-]/g, ""), this.model.UfCliAdr)
          .then(() => {})
        }
      }




      this.validateIE = function(ie, uf) {
        return new Promise((resolve, reject) => {
          dataService.postData('validate-ie', { ie, uf })
          .then(({ validate, isValid, message }) => {
            this.isInscEstAdrCliValid = isValid
            resolve(isValid)
          })
          .catch((error) => {
            this.isInscEstAdrCliValid = false
            resolve(false)
          });
        })
      }

      this.countries = [
        { name: 'Brasil', value: 'BR' },
        { name: 'Bolivia', value: 'BO' },
        { name: 'Canada', value: 'CA' }
      ];


      this.checkEnter =  function(event) {
        if (event.keyCode === 13) {
          this.validateIE(event.target.value.replace(/[.-]/g, ""), this.model.UfCliAdr)
            .then((isValid) => {
              if (isValid) this.model.InscEstAdrCli = event.target.value
            })
        }
      };

      $timeout(() => {
        this.formName = 'vm.add' + this.type + 'Form';
      });



    }
  }
})();
