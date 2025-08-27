(function() {
  'use strict';
  angular.module('app').directive('ngTranscludeReplace', ngTranscludeReplace);

  function ngTranscludeReplace($log) {
    return {
      terminal: true,
      restrict: 'EA',
      link: ($scope, $element, $attr, ctrl, transclude) => {
        if (!transclude) {
          $log.error(
            'orphan',
            'Illegal use of ngTranscludeReplace directive in the template! ' +
              'No parent directive that requires a transclusion found. '
          );
          return;
        }
        transclude(clone => {
          if (clone.length) {
            $element.replaceWith(clone);
          } else {
            $element.remove();
          }
        });
      }
    };
  }
})();
