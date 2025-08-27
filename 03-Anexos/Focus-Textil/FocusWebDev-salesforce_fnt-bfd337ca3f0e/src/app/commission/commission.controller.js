/* COMMISSION */
/* global utils:true */
// import FileSaver from 'file-saver';
(function() {
  'use strict';
  angular.module('app').controller('CommissionController', CommissionController);

  function CommissionController($scope, $state, localService, dataService, $q) {
    const vm = this;
    const vp = $scope.$parent.vm;

    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheetcharset=UTF-8'
    const EXCEL_EXTENSION = '.xlsx'




    vm.page = {
      dataDoc: '',
      ate: '',
      pedido: '',
      nfe: '',
      cliente: '',
      totalVenda: 0,
      totalVendaCents: 0,
      totalComissao: 0,
      totalComissaoCents: 0,
      itensExtrato: []
    };

    vm.modalnfe = {
      nfe: '',
      data: '',
      pedido: '',
      selectNF: selectNF,
      loadNF: loadNF,
      results: [],
      filtered: []
    };

    vm.modalcliente = {
      filter: '',
      filterChange: clienteFilterChange,
      selectCliente: selectCliente,
      results: [],
      filtered: []
    };

    $scope.closeModal = function (id) {
      console.log("CLOSE ", id);
      var modal = document.querySelector(".modal-box.modal-" + id);
      var backdrop = document.querySelector(".modal-bkg");
      if (modal) {
        // clean memory (destroy list)
        // close modal
        modal.style.display = "none";
        // close backdrop
        backdrop.style.display = "none";
      }
    };

    $scope.showModal = function (id) {
      console.log("SHOW ", id);

      var modal = document.querySelector(".modal-box.modal-" + id);
      var backdrop = document.querySelector(".modal-bkg");
      if (modal) {
        document.activeElement.blur();
        // open backdrop
        backdrop.style.display = "block";
        // open modal
        modal.style.display = "block";
      }
    };

    vm.clearForm = function () {
      var pressedClearButton = document.activeElement;
      var parent = pressedClearButton.parentElement;
      var input = parent.querySelector("input");
      angular.element(input).scope().ctrl.model = "";
    };

    vm.submitForm = submitForm;
    vm.exportExcel = exportExcel;
    vm.getOneYearAgo = getOneYearAgo;

    activate();
    function activate() {

      var now = new Date();
      var monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth()-1);
      now = utils.helpers.parseFullDate(now);
      monthAgo = utils.helpers.parseFullDate(monthAgo);

      // loadExtratoComissao({ DataDocInicial: monthAgo, DataDocFinal: now});
      loadDataCliente();
    }

    function clienteFilterChange() {
      var filter = vm.modalcliente.filter.toLowerCase();
      vm.modalcliente.filtered = vm.modalcliente.results.filter(function (cliente) {
        var inCodeCli = cliente.CodeCli.toLowerCase().indexOf(filter) > -1;
        var inName = cliente.Razao01Cli.toLowerCase().indexOf(filter) > -1;
        return inCodeCli || inName;
      });
    }

    function selectCliente(CodeCli) {
      vm.page.cliente = CodeCli;
      $scope.closeModal('cliente');
    }

    function selectNF(nfe) {
      vm.page.nfe = nfe;
      $scope.closeModal('nfe');
    }

    function loadDataCliente() {
      searchCustomer().then(function (resp) {
        console.log("CUSTOMER RESP", resp);
        vm.modalcliente.results = filterCodeCli(resp.Results);
        vm.modalcliente.filtered = vm.modalcliente.results;
      }, function fail(resp) {
        console.log("CUSTOMER FAIL", resp);
      });
    }

    function filterCodeCli(clientes) {
      return clientes.filter(function (cliente) {
        return !!cliente.CodeCli;
      });
    }

    function submitForm($event) {
      console.log("submitForm($event)", $event);
      $event.preventDefault();

      // get all fields
      var DataDocInicial = utils.helpers.parseFullDate(vm.page.dataDoc);
      var DataDocFinal = utils.helpers.parseFullDate(vm.page.ate);
      var Pedido = vm.page.pedido;
      var NotaFiscal = vm.page.nfe;
      var Cliente = vm.page.cliente;

      var params = {};

      if (DataDocInicial) {
        params.DataDocInicial = DataDocInicial;
      }

      if (DataDocFinal) {
        params.DataDocFinal = DataDocFinal;
      }

      if (Pedido) {
        params.Pedido = Pedido;
      }

      if (NotaFiscal) {
        params.NotaFiscal = NotaFiscal;
      }

      if (Cliente) {
        params.Cliente = Cliente;
      }

      console.log("params", params);

      loadExtratoComissao(params);

      return false;
    }

    function loadExtratoComissao(data) {
      // params:
      // DataDocInicial
      // DataDocFinal
      // Pedido
      // NotaFiscal
      // Cliente

      getExtratoComissao(data).then(function (resp) {
        console.log('getExtratoComissao resp', resp);

        var validResp = resp && resp.Results && resp.Results.Itens;

        if ( ! validResp) {
          localService.openModal('Erro ao carregar os itens do extrato')
          return;
        }

        vm.page.itensExtrato = resp.Results.Itens;
        vm.page.totalVenda = parseInt(resp.Results.Totais.Venda.slice(2,));
        vm.page.totalVendaCents = resp.Results.Totais.Venda.slice(resp.Results.Totais.Venda.length - 3,resp.Results.Totais.Venda.length);
        vm.page.totalComissao = parseInt(resp.Results.Totais.Comissao.slice(2,));
        vm.page.totalComissaoCents = resp.Results.Totais.Comissao.slice(resp.Results.Totais.Comissao.length - 3,resp.Results.Totais.Comissao.length);
        // ...        : ??? (NÃO VAI TER)
        // Tipo       : Tipo
        // NF-e       : Nfe
        // Gestor     : Gestor
        // Cliente    : Cliente
        // Pedido     : Pedido
        // ...(Serie) : Serie
        // Cat        : Categoria
        // Data Doc   : DataDoc
        // Qtde       : Qtde
        // UM         : UM
        // Val Venda  : ValorVenda
        // Val Qualid : ValorQuantidade
        // Desc %     : Desconto
        // Com %      : Comissao
        // Tot. Comis : TotalComissao

      }, function fail(err) {
        console.log("FAIL getExtratoComissao", err);
      });
    }

    function getExtratoComissao(data) {
      console.log("getExtratoComissao data", data);
      return dataService.postData('ConsultaComissao', data);
    }

    function removeCurrencyMask(currency) {
      const stringNumber = currency.replace('R$', '').replace(',', '.')
      return parseFloat(stringNumber)
    }

    function toFloat(string) {
      const stringNumber = string.replace(',', '.')
      return parseFloat(stringNumber)
    }

    /**
     * returns `Retornar a data referente a 12 meses atrás para habilitar o campo de busco na comissão`
     */
    function getOneYearAgo () {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() - 12); // Subtrai 12 meses
      currentDate.setDate(1); // Define o dia como 1 para obter o primeiro dia do mês

      // Retornar a data formatada como uma string no formato "YYYY-MM-DD"
      return currentDate.toISOString().split('T')[0];
    }

    function validateDateSearchComission () {
      const currentDate = new Date();
      currentDate.setFullYear(currentDate.getFullYear() - 1);
      currentDate.setDate(1); // Define o dia para o primeiro dia do mês

      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Obtém o mês formatado com zero à esquerda se necessário
      const year = currentDate.getFullYear();

      const yearAgoDate = `${month}/${year}`;

      const customMessage =  'A data deve ser igual ou posterior a ' + yearAgoDate + ' - Por favor, consulte o Adm. Vendas!';

      this.setCustomValidity(customMessage);
    };

    document.getElementById("commission-filter-date-start")
    .oninvalid = validateDateSearchComission

    document.getElementById("commission-filter-date-end")
    .oninvalid = validateDateSearchComission


    function exportExcel() {
      const commissionsToExcel = vm.page.itensExtrato.map(commission => {
        const commissionMapped = {
          'TIPO': commission.Tipo,
          'NF-e': commission.Nfe,
          'Gestor': commission.Gestor,
          'Cliente': commission.Cliente,
          'Pedido': commission.Pedido,
          'Data Doc': commission.DataDoc,
          'Tot. Comissão': removeCurrencyMask(commission.TotalComissao),
        }
        return commissionMapped
      })

      const worksheet = XLSX.utils.json_to_sheet(commissionsToExcel)
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] }
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

      const data = new Blob([excelBuffer], {
        type: EXCEL_TYPE
      })
      saveAs(data, 'comissões' + '_export_' + new Date().getTime() + EXCEL_EXTENSION)
    }

    function loadNF() {
      var params = {};

      var nf = vm.modalnfe.nfe;
      var dataNF = vm.modalnfe.data;
      var pedido = vm.modalnfe.pedido;

      if (nf) {
        params.nf = nf;
      }

      if (dataNF) {
        params.dataNF = utils.helpers.parseFullDate(dataNF);
      }

      if (pedido) {
        params.pedido = pedido;
      }

      console.log("loadNF", params);

      searchNF(params).then(function(resp) {
        var list = resp && resp.Results;
        console.log("SearchNF", resp);
        if (list) {
          vm.modalnfe.results = list;
          vm.modalnfe.filtered = vm.modalnfe.results;
        }
      });
    }

    function searchNF(params) {
      var representante = vp.user.Pernr;
      var nf = params.nf;
      var dataNF = params.dataNF;
      var pedido = params.pedido;

      var defer = $q.defer();
      var promise = defer.promise;

      var isValidRequest = !!representante && !!(nf || dataNF || pedido);

      if (isValidRequest) {
        console.log("searchNF(params)", params);

        dataService.postData('searchNF', params).then(function success(resp) {
          return defer.resolve(resp);
        }, function fail() {
          return defer.reject();
        });

      } else {
        console.log("Invalid NF Search");
        defer.reject();
      }

      return promise;
    }

    function searchCustomer(params) {
      params = params || {};
      var Search = params.Search || '*';
      var Limit = params.Limit || 10000;
      var Page = params.Page || 1;
      var OrderBy = params.OrderBy || '';

      params.Search = Search;
      params.Limit = Limit;
      params.Page = Page;
      params.OrderBy = OrderBy;

      var defer = $q.defer();
      var promise = defer.promise;

      console.log("isValidRequest", Search, Limit, Page, OrderBy);
      console.log("isValidRequest", Search && Limit && Page);
      var isValidRequest = Search && Limit && Page;

      const gestorID = localService.getData('gestorReps')
      if(gestorID !== null) {
        params.gestorID = gestorID
      }

      if (isValidRequest) {

        dataService.postData('Customer', params).then(function success(resp) {
          return defer.resolve(resp);
        }, function fail() {
          return defer.reject();
        });

      } else {
        console.log("Invalid Customer Search");
        defer.reject();
      }

      return promise;
    }
  }
})();
