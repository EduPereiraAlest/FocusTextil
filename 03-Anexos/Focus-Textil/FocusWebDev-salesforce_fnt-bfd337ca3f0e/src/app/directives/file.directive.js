(function() {
  'use strict';

  angular.module('app').directive('fileinput', fileInput);

  function fileInput() {
    return {
      scope: {
        fileinput: '=',
        filepreview: '='
      },
      link: (scope, element) => {
        element.bind('change', changeEvent => {
          const reader = new FileReader();

          scope.fileinput = changeEvent.target.files[0];
          reader.onload = loadEvent => {
            scope.$apply(() => {
              scope.filepreview = loadEvent.target.result;
            });
          };
          reader.readAsDataURL(scope.fileinput);
        });
      }
    };
  }
})();
