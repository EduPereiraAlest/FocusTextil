(function() {
  'use strict';
  angular.module('app').controller('VersionController', VersionController);

  VersionController.$inject = ['$scope', 'version', 'ngDialog', 'localService'];

  function VersionController($scope, version, ngDialog, localService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.data = version.Master;
    vm.env = localService.env
    vp.inside = false;

    vm.openVersions = () => {
      return ngDialog.open({
        template: 'app/download/versionModal.html',
        plain: false,
        scope: $scope
      });
    };
  }
})();
