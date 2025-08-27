(function() {
    'use strict';
    angular.module('app').directive('autoActive', autoActive);

    function autoActive($location) {
        return {
            restrict: 'A',
            scope: false,
            link: (scope, element) => {
                const setActive = () => {
                    const arr = $location.path().split('-');
                    const path =
                        arr[1] === 'fav' || (arr[1] && arr[1].includes('add'))
                            ? $location.path()
                            : arr[0];

                    if (path && path !== '/') {
                        angular.forEach(element.find('a'), link => {
                            if (
                                link.href.match(path + '(?=\\?|$)') &&
                                !angular.element(link).hasClass('disabled')
                            ) {
                                angular.element(link).addClass('active');
                            } else {
                                angular.element(link).removeClass('active');
                            }
                        });
                    }
                };

                _.delay(setActive);
                scope.$on('$locationChangeSuccess', setActive);
            }
        };
    }
})();
