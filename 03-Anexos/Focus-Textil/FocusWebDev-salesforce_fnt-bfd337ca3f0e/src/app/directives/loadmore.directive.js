(function() {
  'use strict';
  angular.module('app').directive('scrollEnds', scrollEnds);

  function scrollEnds($window) {
    return {
      restrict: 'A',
      link: (scope, element, attrs) => {
        const raw = element[0];
        const offset = parseInt(attrs.offset, 10);
        const debounced = _.debounce(() => {
          console.log('[SCROLL]');
          return raw.scrollTop + raw.offsetHeight >= raw.scrollHeight
            ? scope.$apply(attrs.scrollEnds)
            : false;
        }, 300);

        element.css('height', $window.innerHeight - offset + 'px');
        element[0].addEventListener('scroll', debounced);

        raw.scrollTop = 0;
      }
    };
  }
})();
