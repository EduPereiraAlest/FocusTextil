/* global utils:true */
(function () {
  "use strict";
  const tableCart = {
    controller: tableCartController,
    bindings: {
      model: "=",
      kart: "=",
      warnings: "=",
      page: "<",
      params: "<",
      getTotal: "&",
    },
    templateUrl: "app/carts/components/tableCart.html",
  };

  tableCartController.$inject = [
    "$scope",
    "$state",
    "ngDialog",
    "$timeout",
    "localService",
    "ClientService",
  ];

  function tableCartController(
    $scope,
    $state,
    ngDialog,
    $timeout,
    localService,
    ClientService
  ) {
    this.scope = $scope;
    this.state = $state;
    this.ngDialog = ngDialog;
    this.checkRefusal = checkRefusal;
    this.tableOpen = false;
    this.parseCurr = utils.helpers.parseCurr;
    this.getDiscount = getDiscount;
    this.subTotal = subTotal;
    this.regexInputNumber = regexInputNumber;
    this.getType = getType;
    this.ClientService = ClientService;
    this.removeItem = removeItem;
    this.uniqPrice = uniqPrice;
    this.parseStock = parseStock;
    this.debugParseCurr = debugParseCurr;
    $scope.isEfocusCustomer = localService.getData("isEfocusCustomer");

    this.replaceSegmentView = function (segView) {
      if (segView[0].toUpperCase() === "N") {
        const segment = segView.slice(0, 2);
        return segView.replace(segment, "N0");
      }

      return segView;
    };

    var vm = this;

    $timeout(function () {
      vm.model.forEach(function (item) {
        item.PrcBrl = parseFloat(("" + item.PrcBrl).replace(",", "."));
        item.PrcUsd = parseFloat(("" + item.PrcUsd).replace(",", "."));
      });
    }, 0);
  }

  function regexInputNumber(event) {
    const invalidChars = ["-", "+", "e"];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  function debugParseCurr(material, val, pres) {
    var parsed = utils.helpers.parseCurr(val, pres);
    return parsed;
  }

  function subTotal(material) {
    const isMaterialZipperToFourDecimalPrice = material.MaterialZipper ? 4 : 2;

    return (
      this.parseCurr(
        +material.PrcMaterial * +material.Stock.QtdMaterial,
        isMaterialZipperToFourDecimalPrice
      ) || 0
    );
  }

  function getDiscount(material, { currency }, isSufr) {
    // TypeError: Cannot read property 'N0T1N555' of undefined
    // at tableCartController.getDiscount (tableCart.js:59)
    let discount = 0;
    let currPrice = "Preco" + currency.capitalize() + "90";
    // this.scope.$parent.validaMultiplo(material);
    // this.scope.$parent.TotalCarrinhoVisual();

    // MELHORAR
    if (isSufr == "X") {
      if (material.Price[material.Segmento].PrcMat) {
        discount =
          100 -
          (material.PrcMaterial * 100) /
            +material.Price[material.Segmento].PrcMat[currPrice];
      }
    } else {
      if (material.Price[material.Segmento].PrcMat) {
        discount =
          100 -
          (material.PrcMaterial * 100) /
            +material.Price[material.Segmento].PrcMat[currPrice];
      }
    }

    return material.PrcMaterial ? discount.toFixed(4) : 0;
  }

  function uniqPrice(material) {
    let groupCode = material.MaterialCode.substr(0, 9);
    let curr = this.page.currency.capitalize();
    _.chain(this.model)
      .filter((groupMaterial) => groupMaterial.MaterialCode.includes(groupCode))
      .each(
        (materialPrice) =>
          (materialPrice["Prc" + curr] = material["Prc" + curr])
      );

    return this.getTotal();
  }

  function getType(stockCode) {
    return { N: "NORM", PR: "PREV", L: "L. DEF", P: "PILOT", C: "CART" }[
      stockCode
    ];
  }

  function parseStock(stock) {
    return stock ? Math.floor(stock) : "0";
  }

  function removeItem(material) {
    if (
      this.kart.Master.St24Ho ||
      (this.kart.Master.Editavel && material.ItemOv != undefined)
    ) {
      return this.checkRefusal(material);
    }

    // MELHORAR

    this.model = _.reject(this.model, function (rejectedMaterial) {
      var deleteCondition =
        rejectedMaterial.MaterialCode === material.MaterialCode &&
        rejectedMaterial.TpStockCode === material.TpStockCode &&
        rejectedMaterial.Nuance === material.Nuance &&
        rejectedMaterial.Centro === material.Centro &&
        rejectedMaterial.Tonalidade === material.Tonalidade;

      if (deleteCondition) {
        console.log("DELETE FROM CART", rejectedMaterial);
      }

      return deleteCondition;
    });

    return this.getTotal();
  }

  function checkRefusal(material, saveKart) {
    console.log(this, material);

    const modal = this.ngDialog.open({
      template: "app/carts/cartsMot.html",
      controller: "CartsMotController as vm",
      plain: false,
      resolve: {
        material: function setMaterial() {
          return material;
        },
      },
      scope: this.scope,
    });

    return modal;
  }

  tableCartController.prototype.$onInit = function () {
    console.log("oninit")
    const scoped = { ...this };
    scoped.client = null;
    const codeCli =
      scoped.kart && scoped.kart.Master ? scoped.kart.Master.CodeCli : null;

    if (codeCli) {
      this.ClientService.loadClient(codeCli).then((client) => {
        scoped.client = client || null;
        this.client = client || null
        this.isCeClient =
            !!(
              this.client &&
              this.client.Master &&
              this.client.Master.Address &&
              this.client.Master.Address[0] &&
              this.client.Master.Address[0].UfCliAdr === "CE"
            );
      });
    } else {
      console.log("Sem client");
    }

    // this.PricesT106 = {};
    // function handleT106Price(price) {
    //   this.PricesT106[price.item] = price;
    //   console.log(price, this.PricesT106);
    // }
    // this.handleT106Price = handleT106Price;

    this.client = scoped.client

    this.scope.isEfocusCustomer = this.scope.localService
      ? this.scope.localService.getData("isEfocusCustomer")
      : null;

      console.log(this, 'this')
    var vm = this;

    setTimeout(function () {
      vm.model.forEach(function (item) {
        item.PrcBrl = parseFloat(("" + item.PrcBrl).replace(",", "."));
        item.PrcUsd = parseFloat(("" + item.PrcUsd).replace(",", "."));
      });
    }, 0);
  };


  angular.module("app").component("tableCart", tableCart);
})();
