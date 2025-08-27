(function() {
  'use strict';

  const stockLine = () => {
    return {
      //replace: true,
      templateUrl: 'app/books/directives/stockLine.html',
      link: link
    };

    function link() {
      // console.log('[stockLine]', scope.material);
    }
  };

  angular.module('app').directive('stockLine', stockLine);
})();
