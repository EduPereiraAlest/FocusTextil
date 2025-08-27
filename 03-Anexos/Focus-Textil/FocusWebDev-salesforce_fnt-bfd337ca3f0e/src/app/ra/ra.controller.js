/* RA */
(function() {
  'use strict';
  angular.module('app').controller('RaController', RaController);

  function RaController($scope, $state, localService, dataService, $q) {
    let data;
    const vm = this;
    const vp = $scope.$parent.vm;

    vm.submitForm = submitForm;
    vm.showDetails = showDetails;
    vm.clearForm = clearForm;

    vm.showMiniDisplay = false;
    vm.toggleMiniDisplay = toggleMiniDisplay;

    var userPernr, isMulti = Array.isArray(vp.user.Pernr);
    
    if (isMulti) {
      userPernr = vp.user.Pernr[0];
    } else {
      userPernr = vp.user.Pernr;
    }

    console.log(" >>>> vp.user", vp.user);
    console.log(" >>>> userPernr", userPernr);

    vm.page = {
      status: null,
      cliente: '',
      nfe: '',
      datainicial: '',
      material: '',
      numerora: '',
      tipo: null,
      motivo: null,
      representante: userPernr,
      statusList: [],
      motivosList: [],
      tiposList: []
    };
    
    if (isMulti) {
      vm.page.representantes = vp.user.Pernr.map(function (rep) {
        return {name: rep, value: rep};
      });
    } else {
      vm.page.representantes = [{name: userPernr, value: userPernr}];
    }


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

    function selectNF(nfe) {
      vm.page.nfe = nfe;
      $scope.closeModal('nfe');
    }

    function selectCliente(CodeCli) {
      vm.page.cliente = CodeCli;
      $scope.closeModal('cliente');
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

      if (isValidRequest) {
        console.log("searchCustomer(params)", params);
        
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

    function clienteFilterChange() {
      var filter = vm.modalcliente.filter.toLowerCase();
      vm.modalcliente.filtered = vm.modalcliente.results.filter(function (cliente) {
        var inCodeCli = cliente.CodeCli.toLowerCase().indexOf(filter) > -1;
        var inName = cliente.Razao01Cli.toLowerCase().indexOf(filter) > -1;
        return inCodeCli || inName;
      });
    }

    activate();

    function activate() {
      vp.activate();
      console.log('Activate', 'RA', vp);
      console.log('get RAs', vm.page.representante);
      
      defaultSearch();
      populateLists();
      loadDataCliente();
    }

    function populateLists() {
      loadRALists().then(function (resp) {
        if (
          resp && 
          resp.Results
        ) {

          if (
            resp.Results.StatusRa && 
            resp.Results.StatusRa.length
          ) {
            vm.page.statusList = resp.Results.StatusRa.map(function (item) {
              var listItem = {
                name: item.Desc,
                value: item.Cod
              };
              
              return listItem;
            });
          } else {
            console.log("ERROR: NO STATUS LIST AVAILABLE", resp);
          }

          if (
            resp.Results.Motivos && 
            resp.Results.Motivos.length
          ) {
            vm.page.motivosList = resp.Results.Motivos.map(function (item) {
              var listItem = {
                name: item.Desc,
                value: item.Cod
              };
              
              return listItem;
            });
          } else {
            console.log("ERROR: NO MOTIVOS LIST AVAILABLE", resp);
          }

          if (
            resp.Results.Tipos && 
            resp.Results.Tipos.length
          ) {
            vm.page.tiposList = resp.Results.Tipos.map(function (item) {
              var listItem = {
                name: item.Desc,
                value: item.Cod
              };
              
              return listItem;
            });
          } else {
            console.log("ERROR: NO TIPOS LIST AVAILABLE", resp);
          }

        } else {
          console.log("ERROR: RAOptions invalid response", resp);
        }
      });
    }

    function toggleMiniDisplay() {
      vm.showMiniDisplay = !vm.showMiniDisplay;
      console.log("TOGGLED showMiniDisplay", vm.showMiniDisplay);
    }

    function clearForm() {
      var pressedClearButton = document.activeElement;
      var parent = pressedClearButton.parentElement;
      var input = parent.querySelector("input");
      angular.element(input).scope().ctrl.model = "";
    }

    function defaultSearch() {
      searchRA({ representante: vm.page.representante }).then(function(resp) {
        data = resp;
        // vm.ras = data;
        console.log("RESPOSTA SAP: ", resp);

        injectInView(resp);

        // CodeRa  ->    NumeroRA
        // CodePv  ->    Pedido
        // QtdRa    ->    QtdRa
        // CodeNF  ->    NotaFiscal
        // RaDate  ->    DtInicioRa
        // NomeCli ->    Cliente
        // CodeCli  ->    CodeCli
        // CnpjCli   ->    CnpjCli

        // Cliente       : "CONFECCOES DI SELEN S/A"
        // CnpjCli       : "93936987000131"
        // CodeCli       : "1380337400"
        // CriadoPor     : "LRALVES"
        // DescRA        : "teste de criação de  nota cs"
        // DtInicioRA    : "20180814"
        // Expectativa   : "Prorrogação de Duplicata"
        // Motivo        : "Acordo Comercial"
        // NumeroNF      : "702000119"
        // NumeroRA      : "000300000010"
        // Pedido        : "0000000117"
        // QtdRA         : "1 "
        // Representante : "268"
        // RndRa         : ""
        // Status        : "Nota RA encerrada."
        // TipoRA        : "ZC"

        // NumeroRA   -> {{ra.Code}}
        // DtInicioRa -> {{ra.Date}}
        // Pedido     -> {{ra.Order}}
        // NumeroNF   -> {{ra.NFCode}}
        // Cliente    -> {{ra.Client}}
        // Status     -> {{ra.Status}}

      }, localService.errorHandler);
    }

    function injectInView(data) {
      var hasRA = !!(data && data.d && data.d.results && data.d.results.length);
      var raList;

      if (hasRA) {
        raList = data.d.results;

        vm.ras = raList.map(function (ra) {
          ra.Code = ra.NumeroRA;
          ra.Date = buildDate(ra.DtInicioRA);
          ra.Order = ra.Pedido;
          ra.NFCode = ra.NumeroNF;
          ra.Client = ra.Cliente;
          ra.Status = ra.Status;

          return ra;
        });
      } else {
        vm.ras = [];
      }

      console.log("injectInView", vm.ras);
    }

    function submitForm(event) {
      document.activeElement.blur();

      event.preventDefault();
      console.log('[SUBMIT]', vm.page);

      searchRA(getPageFilterParams()).then(function (resp) {
        console.log("RESPOSTA SAP: ", resp);
        
        injectInView(resp);
      });
    }

    function buildDate(date) {
      var day = date.substr(6, 2);
      var month = date.substr(4, 2);
      var year = date.substr(0, 4);
      return day + "/" + month + "/" + year;
    }

    function formatDateFilter(date) {
      var day = ("0" + (date.getDate())).slice(-2);
      var year = date.getFullYear();
      var month = ("0" + (date.getMonth() + 1)).slice(-2);
      var formatted = "" + year + month + day;
      console.log("formatted", formatted);
      return formatted;
    }

    function getPageFilterParams() {
      var params = {};

      if (vm.page.status) {
        params.status = vm.page.status;
      }

      if (vm.page.cliente) {
        params.cliente = vm.page.cliente;
      }

      if (vm.page.nfe) {
        params.nf = vm.page.nfe;
      }

      if (vm.page.datainicial) {
        params.datainicial = formatDateFilter(vm.page.datainicial);
      }

      if (vm.page.material) {
        params.material = vm.page.material;
      }

      if (vm.page.numerora) {
        params.numerora = vm.page.numerora;
      }

      if (vm.page.tipo) {
        params.tipo = vm.page.tipo;
      }

      if (vm.page.motivo) {
        params.motivo = vm.page.motivo;
      }

      params.representante = vm.page.representante;

      console.log("getPageFilterParams", params);

      return params;
    }

    function showDetails(ra) {
      console.log("showDetails GO TO DETAILS", ra);

      $state.go('ras-det', {data: ra});
    }

    function searchRA(searchFilter) {
      // @params searchFilter
      // { status, cliente, nf, datainicial, 
      // representante, material, tipo, motivo }

      console.log("searchRA()", searchFilter);
      return dataService.postData('SearchRA', searchFilter);
    }

    function loadRALists() {
      return dataService.postData('RAOptions');
    }

    function createRA(oDataParams) {
      // @params oDataParams
      // { TpNota, TextoBreve, CriadoPor, CodigoMotivo, CodigoExpectativa, 
      // TextoExpectativa, TextoNavig, ItemNavig, ParceiroNavig }

      var TpNota = oDataParams.TpNota;
      var TextoBreve = oDataParams.TextoBreve;
      var CriadoPor = oDataParams.CriadoPor;
      var CodigoMotivo = oDataParams.CodigoMotivo;
      var CodigoExpectativa = oDataParams.CodigoExpectativa;
      var TextoExpectativa = oDataParams.TextoExpectativa;
      var TextoNavig = oDataParams.TextoNavig;
      var ItemNavig = oDataParams.ItemNavig;
      var ParceiroNavig = oDataParams.ParceiroNavig;

      var createParams = {
        TpNota, TextoBreve, CriadoPor, CodigoMotivo, CodigoExpectativa, 
        TextoExpectativa, TextoNavig, ItemNavig, ParceiroNavig
      };

      console.log("createRA()", createParams);
      return dataService.postData('CreateRA', createParams);
    }

    function filterRA(filter) {
      var filtered;
      if (filter) {
        filtered = data.filter(function (ra) {
          var fields = Object.keys(ra);
          var matchFound = false;
          fields.forEach(function (key) {
            var content = ra[key] + "";
            matchFound = matchFound || (content.indexOf(filter) > -1);
          });
          return matchFound;
        });

      } else {
        filtered = data;
      }

      vm.ras = filtered;
    }
  }
})();
