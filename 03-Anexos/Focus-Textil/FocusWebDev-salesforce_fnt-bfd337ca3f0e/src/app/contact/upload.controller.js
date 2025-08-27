/*  UPLOAD */
(function() {
  'use strict';
  angular.module('app').controller('UploadController', UploadController);

  function UploadController($scope) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.data = { desc: '' };
    vm.uploadFile = uploadFile;
    checkItem();

    function uploadFile(event) {
      event.preventDefault();
      vm.data.file.desc = vm.data.desc;
      return $scope.closeThisDialog(vm.data.file);
    }

    function checkItem() {
      $scope.$watch('vm.data.desc', desc => {
        if (!desc) {
          return false;
        }

        let item = _.findWhere(vp.files, { desc }) || false;

        return $scope.formage.$setValidity('desc', !item);
      });
    }
  }
})();
