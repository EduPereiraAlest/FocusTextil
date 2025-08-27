/* global corReady:true */

(function() {
    'use strict';
    angular.module('app').directive('backgroundImage', backgroundImage);

    function backgroundImage($window, localService, cordovaService) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attr) {
            let image;
            let cssClass = {};

            function getRGB() {
                if (
                    scope &&
                    scope.material &&
                    scope.material.RGB
                ) {
                    return scope.material.RGB;
                
                } else if (
                    scope &&
                    scope.$parent &&
                    scope.$parent.$parent &&
                    scope.$parent.$parent.$ctrl &&
                    scope.$parent.$parent.$ctrl.model &&
                    scope.$parent.$parent.$ctrl.model.RGB
                ) {
                    return scope.$parent.$parent.$ctrl.model.RGB;
                }
            }

            attr.$observe('backgroundImage', () => {
                if (corReady) {
                    cordovaService.imageFunc(attr.backgroundImage, attr.pageName).then(res => {
                        cssClass.backgroundImage = getOffline(res, attr.pageName);
                        return element.css(cssClass);
                    }, localService.errorHandler);
                } else {
                    image = new Image();
                    image.src = getPath(attr.backgroundImage, attr.pageName);
                    image.onload = () => {
                        cssClass.backgroundImage = 'url(' + image.src + ')';
                        return element.css(cssClass);
                    };
                    image.onerror = () => {
                        var rgb = getRGB();
                        if (rgb) {
                            cssClass.background = rgb;
                            
                        } else {
                            cssClass.backgroundImage = 'url(images/small_NONE.jpg)';
                        }
                        return element.css(cssClass);
                    };
                }
            });
        }

        function getOffline(base, type) {
            let path = type === 'DETAILS' ? 'large_' : 'small_';

            return base
                ? 'url(data:image/jpg;base64,' + base + ')'
                : 'url(images/' + path + 'NONE.jpg)';
        }

        function getPath(id, type) {
            // let dir = 'http://189.126.197.169/img/';
            // let dir = 'http://dev-hn-cs.focustextil.loc.br/produtos_qa/';
            // let dir = 'http://187.62.223.171/produtos/';
            let dir = 'https://webrep2.focustextil.com.br/imgproxy/produtos/';
            let path = type === 'DETAILS' ? 'large/' : 'thumb/';

            return dir + path + id + '.jpg';
        }
    }
})();
