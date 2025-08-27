/* CLIENTS DETAIL */
(function() {
  'use strict';
  angular.module('app').controller('RaItensController', RaItensController);

  function RaItensController($scope, $stateParams, dataService, localService) {
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.address = {};
    vm.subTotal = subTotal;

    vm.ra = {
      CodeRa: '110276',
      CodePv: 'LHR41H',
      QtdRa: 3,
      CodeNF: '03022010',
      RaDate: '26/09/11 16:20',
      RndRa: '110',
      NomeCli: 'ABB CONFECCOES LTDA EPP',
      CodeCli: 1384235707,
      CnpjCli: '03078438000180'
    };

    vm.types = [
      { Cod: 'ZC', Desc: 'Comercial' },
      { Cod: 'ZL', Desc: 'Logística' },
      { Cod: 'ZQ', Desc: 'Qualidade' },
      { Cod: 'ZT', Desc: 'Transporte' },
      { Cod: 'ZD', Desc: 'DAE' },
      { Cod: 'ZS', Desc: 'Sinistro' }
    ];

    vm.motives = [
      { Cod: 'A1', TCod: 'ZC', Desc: 'Acordo Comercial' },
      { Cod: 'A2', TCod: 'ZC', Desc: 'Alteração no Pedido de venda' },
      {
        Cod: 'A3',
        TCod: 'ZC',
        Desc: 'ATC Faturado sem autorização do representante'
      },
      { Cod: 'A4', TCod: 'ZC', Desc: 'Cliente comprou cor no papel' },
      { Cod: 'A5', TCod: 'ZC', Desc: 'Cliente desistiu da piloto sem aviso' },
      { Cod: 'A6', TCod: 'ZC', Desc: 'Cliente encerrando as atividades' },
      { Cod: 'A7', TCod: 'ZC', Desc: 'Compra indevida pelo cliente' },
      { Cod: 'A8', TCod: 'ZC', Desc: 'Dificuldade financeira' },
      { Cod: 'A9', TCod: 'ZC', Desc: 'Frete cobrado do cliente indevidamente' },
      { Cod: 'A10', TCod: 'ZC', Desc: 'NF retida na fiscalização – ICMS' },
      { Cod: 'A11', TCod: 'ZC', Desc: 'Pedido cancelado' },
      { Cod: 'A12', TCod: 'ZD', Desc: 'Atraso na entrega' },
      {
        Cod: 'A13',
        TCod: 'ZD',
        Desc: 'Cliente com restrição (Sintegra)'
      },
      { Cod: 'A14', TCod: 'ZD', Desc: 'Cliente fechado' },
      { Cod: 'A15', TCod: 'ZD', Desc: 'Embalagem Avariada' },
      { Cod: 'A16', TCod: 'ZD', Desc: 'Endereço Divergente do cadastro' },
      { Cod: 'A17', TCod: 'ZD', Desc: 'Entrega fora do prazo' },
      {
        Cod: 'A18',
        TCod: 'ZD',
        Desc: 'Falta autorização para recebimento'
      },
      { Cod: 'A19', TCod: 'ZD', Desc: 'Falta espaço no cliente' },
      {
        Cod: 'A20',
        TCod: 'ZD',
        Desc: 'MERC. Em desacordo com o PD/NF compra'
      },
      { Cod: 'A21', TCod: 'ZD', Desc: 'MERC. Já retornou ao depósito' },
      { Cod: 'A22', TCod: 'ZD', Desc: 'MERC. Trocada na transportadora' },
      { Cod: 'A23', TCod: 'ZD', Desc: 'Pedido cancelado' },
      { Cod: 'A24', TCod: 'ZD', Desc: 'Pedido duplicado' },
      {
        Cod: 'A25',
        TCod: 'ZD',
        Desc: 'Pedido fat em desacordo com o pedido do cliente'
      },
      { Cod: 'A26', TCod: 'ZD', Desc: 'Peças / Volume extraviado' },
      { Cod: 'A27', TCod: 'ZD', Desc: 'Preço em desacordo com o pedido' },
      {
        Cod: 'A28',
        TCod: 'ZD',
        Desc: 'Qualidade reprovada pelo cliente'
      },
      { Cod: 'A29', TCod: 'ZL', Desc: 'Molhado / Mofo' },
      { Cod: 'A30', TCod: 'ZL', Desc: 'Tamanho da peça em desacordo' },
      { Cod: 'A31', TCod: 'ZL', Desc: 'Troca de mercadoria no estoque' },
      { Cod: 'A32', TCod: 'ZQ', Desc: 'Aspecto diferente do padrão' },
      {
        Cod: 'A33',
        TCod: 'ZQ',
        Desc: 'Baixa resistência / Fragilidade ao rasgo'
      },
      {
        Cod: 'A34',
        TCod: 'ZQ',
        Desc: 'Baixa solidez na cor (Atrito e Lavagem)'
      },
      { Cod: 'A35', TCod: 'ZQ', Desc: 'Barramento' },
      { Cod: 'A36', TCod: 'ZQ', Desc: 'Buracos' },
      { Cod: 'A37', TCod: 'ZQ', Desc: 'Composição divergente no Tecido' },
      { Cod: 'A38', TCod: 'ZQ', Desc: 'Composição divergente na Etiqueta' },
      { Cod: 'A39', TCod: 'ZQ', Desc: 'Composição divergente na Nota Fiscal' },
      { Cod: 'A40', TCod: 'ZQ', Desc: 'Contaminação de fio' },
      { Cod: 'A41', TCod: 'ZQ', Desc: 'Desencaixe do desenho' },
      {
        Cod: 'A42',
        TCod: 'ZQ',
        Desc: 'Diferença de tonalidade entre os rolos'
      },
      { Cod: 'A43', TCod: 'ZQ', Desc: 'Diferença de tonalidade na mesma peça' },
      { Cod: 'A44', TCod: 'ZQ', Desc: 'Divergência de informação no BOOK' },
      { Cod: 'A45', TCod: 'ZQ', Desc: 'Falta de metragem / Kg' },
      { Cod: 'A46', TCod: 'ZQ', Desc: 'Elasticidade baixa' },
      { Cod: 'A47', TCod: 'ZQ', Desc: 'Embalagem a vácuo' },
      { Cod: 'A48', TCod: 'ZQ', Desc: 'Emendas' },
      { Cod: 'A49', TCod: 'ZQ', Desc: 'Esgarçamento' },
      { Cod: 'A50', TCod: 'ZQ', Desc: 'Encolhimento' },
      { Cod: 'A51', TCod: 'ZQ', Desc: 'Falha na estamparia' },
      { Cod: 'A52', TCod: 'ZQ', Desc: 'Falha no bordado' },
      { Cod: 'A53', TCod: 'ZQ', Desc: 'Fio Grosso (Lagarta)' },
      { Cod: 'A54', TCod: 'ZQ', Desc: 'Fio irregular' },
      { Cod: 'A55', TCod: 'ZQ', Desc: 'Fio puxado' },
      { Cod: 'A56', TCod: 'ZQ', Desc: 'Furos contínuos' },
      { Cod: 'A57', TCod: 'ZQ', Desc: 'Gramatura' },
      { Cod: 'A58', TCod: 'ZQ', Desc: 'Largura' },
      { Cod: 'A59', TCod: 'ZQ', Desc: 'Manchas' },
      { Cod: 'A60', TCod: 'ZQ', Desc: 'Neps (piolho)' },
      { Cod: 'A61', TCod: 'ZQ', Desc: 'Ondulação' },
      { Cod: 'A62', TCod: 'ZQ', Desc: 'Quebradura' },
      { Cod: 'A63', TCod: 'ZQ', Desc: 'Tecido enrolado (Encharutando)' },
      { Cod: 'A64', TCod: 'ZQ', Desc: 'Tecido sujo' },
      { Cod: 'A65', TCod: 'ZQ', Desc: 'Tonalidade diferente do book' },
      { Cod: 'A66', TCod: 'ZQ', Desc: 'Toque áspero' },
      { Cod: 'A67', TCod: 'ZQ', Desc: 'Trama torta' },
      { Cod: 'A68', TCod: 'ZQ', Desc: 'Tubete' },
      { Cod: 'A69', TCod: 'ZQ', Desc: 'Vinco' },
      { Cod: 'A70', TCod: 'ZS', Desc: 'Sinistro' },
      { Cod: 'A71', TCod: 'ZT', Desc: 'Atraso na entrega' },
      { Cod: 'A72', TCod: 'ZT', Desc: 'Embalagem avariada / Sujeira' },
      { Cod: 'A73', TCod: 'ZT', Desc: 'Peças / volume extraviado' }
    ];

    vm.filterExpression = motive => (vm.ra.RaType ? motive.TCod === vm.ra.RaType.Cod : null);

    activate();

    function activate() {
      vp.activate();
      return dataService.postData('Order', { CodeOv: $stateParams.id }).then(({ Results }) => {
        vm.order = Results;
        vm.delivery = vm.order.Master.DelivLoc;
        return vm.order;
      }, localService.errorHandler);
    }

    function subTotal(material) {
      return (material.QtdMaterialOrg * material.PrcSale).toFixed(2);
    }
  }
})();
