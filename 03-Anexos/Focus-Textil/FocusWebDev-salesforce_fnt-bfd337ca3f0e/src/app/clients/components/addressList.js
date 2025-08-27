(function() {
  'use strict';

  angular.module('app').directive('addressList', addressList);

  function addressList() {
    return {
      replace: true,
      templateUrl: 'app/clients/components/addressList.html',
      controller: addressListController,
      controllerAs: '$ctrl',
      bindToController: {
        list: '=',
        remove: '&',
        disabled: '@'
      }
    };

    function addressListController() {
      this.removeItem = item => this.remove({ item, list: 'addres' });
    }
  }
})();
