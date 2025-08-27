(function () {
  'use strict';

  angular.module('app').directive('menuFooter', menuFooter);

  function menuFooter() {
    menuFooterController.$inject = [
      '$scope',
      '$rootScope',
      '$state',
      'localService'
    ];
    return {
      scope: {},
      templateUrl: 'app/layout/menuFooter.html',
      controller: menuFooterController,
      replace: true,
      controllerAs: '$ctrl',
      bindToController: {
        kart: '='
      }
    };

    function menuFooterController($scope, $rootScope, $state, localService) {
      this.items = 0;
      const vm = this;
      var profileBlocked = false;
      var managerProfile = '';
      var advProfile = ''
      var Pends = '';

      vm.managerProfile = managerProfile;
      vm.advProfile = advProfile;
      vm.profileBlocked = profileBlocked;
      vm.Pends = Pends;

      $rootScope.$on("setLoginPathEmitter", function(){
        vm.advProfile = localService.getData('loginPathAdv');
        vm.managerProfile = localService.getData('loginPathGs');

        if(vm.advProfile || vm.managerProfile){
          vm.profileBlocked = true;
          console.log(vm.profileBlocked, 'vm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlockedvm.profileBlocked')
        }
     });


     vm.Pends = localService.getData('pends');

      $scope.$watch(
        () => $state.$current.name,
        url => (this.menu = url !== 'home' && url !== 'login' && url !== 'download')
      );

      $scope.$watch(
        '$ctrl.kart.Master.Item902',
        kartItems => (this.items = kartItems ? kartItems.length : 0)
      );

      $scope.isEfocusCustomer = localService.getData('isEfocusCustomer');
      
      $scope.resetCliente = function () {
        vm.kart = null;
        localService.setData('kart', null);
        $state.go('home');
      };
    }
  }
})();
