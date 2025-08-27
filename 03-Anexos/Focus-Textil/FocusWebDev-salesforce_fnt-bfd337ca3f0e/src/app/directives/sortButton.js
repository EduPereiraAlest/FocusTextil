(function() {
  'use strict';
  angular.module('app').directive('sortButton', sortButton);

  function sortButton() {
    return {
      replace: true,
      transclude: true,
      link: link,
      templateUrl: 'app/directives/sortButton.html'
    };

    function link(scope, element, attrs) {
      const tag = element.find('span');
      const ctrl = scope.$ctrl || scope.vm;
      const { page, submitForm } = ctrl;
      const sortFun = submitForm.bind(ctrl);
      const sortQuery = attrs.collumn;
      const sortOptions = {
        0: { sort: ' ', css: 'icon-tag-down disabled' },
        1: { sort: sortQuery, css: 'icon-tag-up' },
        2: { sort: '-' + sortQuery, css: 'icon-tag-down' }
      };

      scope.$ctrl = scope.$ctrl || scope.vm;

      let dir = 0;

      scope.$watch('$ctrl.page.sort', sort => {
        dir = 0;
        for (let option in sortOptions) {
          if (sort && sortOptions[option].sort === sort) {
            dir = parseInt(option, 10);
          }
        }
        tag.attr('class', 'icon ' + sortOptions[dir].css);
      });

      element.bind('click', () => {
        dir += 1;

        if (dir > 2) {
          dir = 0;
        }

        tag.attr('class', 'icon ' + sortOptions[dir].css);
        page.sort = sortOptions[dir].sort;

        sortFun();
      });
    }
  }
})();
