(function() {
  'use strict';

  angular.module('app').directive('contactsList', contactsList);

  function contactsList() {
    return {
      replace: true,
      templateUrl: 'app/clients/components/contactsList.html',
      controller: contactsListController,
      controllerAs: '$ctrl',
      bindToController: {
        list: '=',
        remove: '&',
        disabled: '@'
      }
    };

    function contactsListController() {
      this.removeItem = item => this.remove({ item, list: 'contacs' });
    }
  }
})();
