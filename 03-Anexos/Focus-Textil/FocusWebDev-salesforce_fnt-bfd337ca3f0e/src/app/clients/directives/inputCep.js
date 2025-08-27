(function () {
  'use strict';

  angular.module('app').directive('inputCep', inputCep);

  function inputCep(dataService, localService) {
    return {
      scope: {
        model: '=',
        formCtrl: '=',
        name: '@',
        disabled: '='
      },
      replace: true,
      link: link,
      templateUrl: 'app/clients/directives/inputCep.html'
    };

    function link(scope, element, attrs) {
      let input = element.find('input');

      if (
        scope && 
        scope.model && 
        typeof scope.model.PostCodRedisp == "string"
      ) {
        scope.model.PostCodRedisp = scope.model.PostCodRedisp.replace(/\D/g, '');
      }

      scope.name = scope.name || 'CepCli';

      input.on('keydown keypress', function (event) {
        if (event.which === 13) {
          getZip(scope.model);
          return event.target.blur();
        }
        return false;
      });

      scope.$watch('input', function (newValue, oldValue, scope) {
        if (newValue) {
          if (newValue.length === 9) {
            getZip(scope.model);
            return event.target.blur();
          } else {
            return false;
          }
        } else {
          return false
        }

      });

      scope.getZip = getZip;

      function getZip(address) {
        let zip = address[scope.name];

        return dataService
          .postData('ZipAddress', {
            ZipCode: zip.insert('-', 5)
          })
          .then(({
            Results
          }) => {
            let cepObject = setObject(Results, scope.name);

            return Results.Cidade ?
              _.extend(address, _.omit(cepObject, _.isEmpty)) :
              localService.openModal('Cep não encontrado.');
          }, localService.errorHandler);
      }

      function setObject(Results, name) {
        let cepCli = {
          LogrCli: Results.Rua || null,
          BairroCli: Results.Bairro,
          CityCli: Results.Cidade,
          UfCliAdr: Results.Estado,
          PaisCli: 'BR',
          ZipBlock: Results
        };

        let cepCart = {
          AddrRedisp: Results.Rua,
          NeighRedisp: Results.Bairro,
          CityRedisp: Results.Cidade,
          StateRedisp: Results.Estado
        };

        return name === 'CepCli' ? cepCli : cepCart;
      }
    }
  }
})();
