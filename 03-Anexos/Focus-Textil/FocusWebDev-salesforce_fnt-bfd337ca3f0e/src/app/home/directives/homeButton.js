(function() {
  'use strict';
  angular.module('app').directive('homeButton', homeButton);

  function homeButton() {
    return {
      replace: true,
      transclude: true,
      scope: {
        link: '@',
        alink: '@',
        icon: '@',
        text: '=',
        unable: '<',
        image: '@',
      },
      templateUrl: 'app/home/directives/homeButton.html'
    };
  }
})();
