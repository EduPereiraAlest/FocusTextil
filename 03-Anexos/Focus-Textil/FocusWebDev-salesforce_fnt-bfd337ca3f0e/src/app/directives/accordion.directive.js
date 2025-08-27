(function() {
    'use strict';
    angular.module('app').directive('simpleAccordion', simpleAccordion);

    function simpleAccordion($timeout) {
        return {
            link: link,
            restrict: 'A'
        };

        function link(scope, element) {
            $timeout(() => {
                element.addClass('accordion-content');
                element.find('h3').bind('click', ({ target }) => {
                    let box = angular.element(target).parent();
                    let sib = siblings(box[0]);

                    return box.hasClass('disabled')
                        ? box.removeClass('active')
                        : (angular.element(sib).removeClass('active'), box.toggleClass('active'));
                });
            });

            scope.clickTest = event => console.log('[clickAccTest]', event);
        }

        function prevSiblings(target) {
            let sibling = [];
            let n = target;

            while ((n = n.previousElementSibling)) {
                sibling.push(n);
            }
            return sibling;
        }

        function nextSiblings(target) {
            let sibling = [];
            let n = target;

            while ((n = n.nextElementSibling)) {
                sibling.push(n);
            }
            return sibling;
        }

        function siblings(target) {
            let prev = prevSiblings(target) || [];
            let next = nextSiblings(target) || [];

            return prev.concat(next);
        }
    }

    angular.module('app').directive('accordionTitle', accordionTitle);

    function accordionTitle() {
        return {
            replace: true,
            transclude: true,
            templateUrl: 'app/directives/accordionTitle.html'
        };
    }
})();
