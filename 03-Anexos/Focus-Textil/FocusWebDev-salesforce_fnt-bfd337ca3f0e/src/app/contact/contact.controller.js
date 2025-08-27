/*  CONTACT */
(function() {
  'use strict';
  angular.module('app').controller('ContactController', ContactController);

  function ContactController($scope, ngDialog, localService, dataService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vp.activate();

    vm.files = [];
    vm.data = {};

    vm.areas = [
      { value: 'Comercial', name: 'Comercial' },
      { value: 'Compras (Supply)', name: 'Compras (Supply)' },
      { value: 'Cyber (Logistica)', name: 'Cyber (Logistica)' },
      { value: 'Financeiro', name: 'Financeiro' },
      { value: 'Produto (Qualidade)', name: 'Produto (Qualidade)' },
      { value: 'TI (Sistemas)', name: 'TI (Sistemas)' },
      { value: 'Transporte', name: 'Transporte' }
    ];

    vm.openUpload = openUpload;
    vm.removeFile = removeFile;
    vm.sendMsg = sendMsg;

    function openUpload() {
      const modal = ngDialog.open({
        template: 'app/contact/uploadModal.html',
        controller: 'UploadController as vm',
        plain: false,
        scope: $scope
      });

      modal.closePromise.then(
        ({ value }) => (!value || !value.name ? false : vm.files.push(value))
      );
    }

    function sendMsg() {
      if (vm.files.length) {
        _.each(vm.files, (file, id) => {
          vm.data['Upld' + id] = file;
        });
      }

      return dataService.postFile('CommunicationChannel', vm.data).then(({ Results }) => {
        vm.files = [];
        vm.data = {};
        vm.conform.$setPristine();
        return localService.openModal(Results);
      }, localService.errorHandler);
    }

    // DEFAULT FUNCTIONS

    function removeFile(removed) {
      vm.files = _.reject(vm.files, file => file.desc === removed.desc);
    }
  }
})();
