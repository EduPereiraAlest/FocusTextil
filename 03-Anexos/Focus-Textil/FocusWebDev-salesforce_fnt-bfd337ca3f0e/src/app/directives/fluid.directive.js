(function() {
  'use strict';
  angular.module('app').directive('fluidHeight', fluidHeight);

  function fluidHeight($window, $timeout) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attr) {
      let offset = parseInt(attr.fluidHeight, 10);
      let adjust = () => {
        element.css('height', $window.innerHeight - offset + 'px');
      };

      $timeout(adjust, 300);
    }
  }
})();
