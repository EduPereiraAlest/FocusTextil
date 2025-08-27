/* MOTIVES */
(function() {
  'use strict';
  angular.module('app').controller('CartsMotController', CartsMotController);

  function CartsMotController($scope, material, $rootScope) {
    const vm = this;

    vm.sendMotive = sendMotive;
    vm.motive = material.Abgru;

// 01 - Canc. Supply Chain-Atraso data entrega
// 03 - Canc. Comercial-Cliente Comprou Concorre
// Y0 - Canc. Comercial-Substituição de Pedido
// Y1 - Canc. Comercial-Cliente Não Conc. c/ Pre
// Y6 - Canc. Comercial-Substituição Artigo/SKU
// Z9 - Canc. Comercial-Representante Errou
// ZP - Canc. Comercial-Pilotagem Reprovada

    vm.motives = [
      // { value: 'ZI', name: 'Preço' },
      // { value: 'ZJ', name: 'Cliente desistiu' },
      // { value: 'ZL', name: 'Pedido em duplicidade' },
      // { value: 'ZM', name: 'Cliente não aceita parcial' },
      // { value: 'ZN', name: 'Qtde insuficiente' },
      // { value: 'ZO', name: 'Diferente da amostra' },
      { value: '01', name: 'Canc. Supply Chain-Atraso data entrega' },
      { value: '03', name: 'Canc. Comercial-Cliente Comprou Concorre' },
      { value: 'Y0', name: 'Canc. Comercial-Substituição de Pedido' },
      { value: 'Y1', name: 'Canc. Comercial-Cliente Não Conc. c/ Pre' },
      { value: 'Y6', name: 'Canc. Comercial-Substituição Artigo/SKU' },
      { value: 'Z9', name: 'Canc. Comercial-Representante Errou ' },
      { value: 'ZP', name: 'Canc. Comercial-Pilotagem Reprovada' }
    ];

    function sendMotive() {
      material.Abgru = vm.motive;
      $rootScope.$emit("CallParentMethod", {});
      return $scope.closeThisDialog();
    }
  }
})();
