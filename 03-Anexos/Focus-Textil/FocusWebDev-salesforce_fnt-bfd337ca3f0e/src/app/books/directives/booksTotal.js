(function() {
  'use strict';

  const booksTotal = () => {
    return {
      replace: true,
      scope: {
        kart: '='
      },
      templateUrl: 'app/books/directives/booksTotal.html',
      link: link
    };

    function link(scope) {
      if (!scope.kart) {
        return;
      }

      scope.$watch('kart.Master.Item902', items => {
        if (items && items.length) {
          scope.total = parseTotal(items);
        }
      }, true);
    }

    function parseTotal(items) {
      var chain = _.chain(items);
      var groupBy = chain.groupBy('UnidMed');
      var mapped = groupBy.map(function (group, key) {
        var qtd = {
          UniMed: key,
          QtdMaterial: _(group).reduce(function (m, x) {
            var sum = m + parseInt(x.QtdMaterial, 10);
            return sum;
          }, 0)
        };

        return qtd;
      });
      var val = mapped.value();

      return val;
    }
  };

  angular.module('app').directive('booksTotal', booksTotal);
})();
