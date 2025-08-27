/* global utils:true */
(function () {
  "use strict";
  angular.module("app").directive("currencyButton", currencyButton);

  function currencyButton(rulesService) {
    const INCREMENTAL_PERCENTAGEM_IN_CREDIT_FORM = 3; // exemple 3%

    return {
      replace: true,
      scope: {
        price: "=",
        params: "=",
        currency: "=",
        promo: "=",
        material: "=",
        kart: "=",
        isCeClient: "=",
      },
      link: link,
      templateUrl: "app/directives/currencyButton.html",
    };

    function link(scope, elem, attrs) {
      if (scope.params) {
        scope.items = parseT106(
          pagtList(scope.price, scope.params.FinancyFactor, scope.promo, scope),
          scope.isCeClient,
          scope.material,
          scope
        );
        scope.isPromoColor = scope.material.Ipad === "C";
      }
    }

    function parseT106(items, isCeClient, material) {
      let arrValues = [
        "A VISTA",
        "30 DIAS",
        "45 DIAS",
        "60 DIAS",
        "90 DIAS",
        "C-CRÉDITO",
        "PROMO",
        "SALES",
        "T106 - A VISTA",
        "T106 - 60 DIAS",
        "T106 - 45 DIAS",
        "T106 - 30 DIAS",
        "T106 - 90 DIAS",
      ];
      let newItems = items;
      let changedItems = false;

      if (
        isCeClient &&
        items.find(
          (item) =>
            item.name.startsWith("T106 - ") &&
            item.BRL !== "0" &&
            item.USD !== "0"
        )
      ) {
        newItems = items.filter((item) => {
          return (
            item.name.startsWith("T106 - ") || item.name.startsWith("C-CRÉDITO")
          );
        });
        changedItems = true;
      }

      if (
        (!isCeClient &&
          !(
            Array.isArray(material.Centros) &&
            material.Centros.length === 1 &&
            material.Centros[0] === "T106"
          )) ||
        (Array.isArray(material.Centros) &&
          material.Centros.length === 1 &&
          material.Centros[0] === "T106" && !isCeClient)
      ) {
        newItems = newItems.filter(
          (item) =>
            !item.name.startsWith("T106 - 30") &&
            !item.name.startsWith("T106 - 45") &&
            !item.name.startsWith("T106 - 60")
        );
      }

      if (changedItems) {
        newItems = newItems.map((item) => ({
          ...item,
          name: item.name.replace("T106 - ", ""),
        }));
      }

      if (newItems[0].name === "C-CRÉDITO") {
        const credit = newItems.shift();

        newItems.push({ ...credit });
        newItems = newItems.sort((a, b) => {
          const indexA = arrValues.indexOf(a.name);
          const indexB = arrValues.indexOf(b.name);

          // Se não encontrar, coloca no final

          return (
            (indexA === -1 ? arrValues.length : indexA) -
            (indexB === -1 ? arrValues.length : indexB)
          );
        });
      }

      return newItems;
    }

    function pagtList(price, finance, promo, scope) {
      let arrValues = [
        "A VISTA",
        "30 DIAS",
        "45 DIAS",
        "60 DIAS",
        "90 DIAS",
        "C-CRÉDITO",
        "PROMO",
        "SALES",
        "T106 - A VISTA",
        "T106 - 60 DIAS",
        "T106 - 45 DIAS",
        "T106 - 30 DIAS",
        "T106 - 90 DIAS",
      ];
      const isMaterialZipper = scope.material.MaterialZipper;
      const decimalZipper = isMaterialZipper ? 4 : 2;

      scope.activePrice = "";
      arrValues = arrValues.map((item) => {
        const hasT106 =
          scope &&
          scope.material &&
          ((scope.material.Centros &&
            Array.isArray(scope.material.Centros) &&
            scope.material.Centros.includes("T106")) ||
            scope.material.Centro === "T106");

        // var dateNow = new Date();
        // var date = new Date(promo.DtPromoValR);

        if (item == "PROMO") {
          if (promo) {
            if (parseFloat(promo.PrPromoR) > 0) {
              var itemPreco = {
                name: item,
              };

              if (parseFloat(promo.PrPromoR) > 0) {
                itemPreco.BRL = promo.PrPromoR.replace(".", ",");
              } // TO:DO
              if (parseFloat(promo.PrPromoD) > 0) {
                itemPreco.USD = promo.PrPromoD.replace(".", ",");
              }
            } else if (parseFloat(promo.PrPromoD) > 0) {
              var itemPreco = {
                name: item,
              };

              if (parseFloat(promo.PrPromoR) > 0) {
                itemPreco.BRL = promo.PrPromoR.replace(".", ",");
              } // TO:DO
              if (parseFloat(promo.PrPromoD) > 0) {
                itemPreco.USD = promo.PrPromoD.replace(".", ",");
              }
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          }
        } else if (item == "SALES") {
          if (promo) {
            if (parseFloat(promo.PrSaleR) > 0) {
              var itemPreco = {
                name: item,
              };

              if (parseFloat(promo.PrSaleR) > 0) {
                itemPreco.BRL = promo.PrSaleR.replace(".", ",");
              }
              if (parseFloat(promo.PrSaleD) > 0) {
                itemPreco.USD = promo.PrSaleD.replace(".", ",");
              }
            } else if (parseFloat(promo.PrSaleD) > 0) {
              var itemPreco = {
                name: item,
              };

              if (parseFloat(promo.PrSaleR) > 0) {
                itemPreco.BRL = promo.PrSaleR.replace(".", ",");
              }
              if (parseFloat(promo.PrSaleD) > 0) {
                itemPreco.USD = promo.PrSaleD.replace(".", ",");
              }
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          }
        } else if (item == "T106 - A VISTA") {
          // FATOR T106 = 9.5 (1.095%)
          try {
            if (hasT106) {
              var BRLprice = Number(
                parseFinance(
                  price.BRL,
                  "A VISTA",
                  finance,
                  "BRL",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var USDprice = Number(
                parseFinance(
                  price.USD,
                  "A VISTA",
                  finance,
                  "USD",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var itemPreco = {
                name: item,
                BRL: ((10.5 / 100) * BRLprice + BRLprice)
                  .toFixed(2)
                  .toString()
                  .replace(".", ","),
                USD: ((10.5 / 100) * USDprice + USDprice)
                  .toFixed(2)
                  .toString()
                  .replace(".", ","),
              };
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          } catch (e) {
            var itemPreco = {
              name: item,
              BRL: "0",
              USD: "0",
            };
          }
        } else if (item === "C-CRÉDITO") {
          let basePriceBRL = price.BRL;
          let basePriceUSD = price.USD;

          if (hasT106 && scope.isCeClient) {
            let T106BRLprice = Number(
              parseFinance(
                price.BRL,
                "90 DIAS",
                finance,
                "BRL",
                isMaterialZipper
              ).replace(",", ".")
            );
            let T106USDprice = Number(
              parseFinance(
                price.USD,
                "90 DIAS",
                finance,
                "USD",
                isMaterialZipper
              ).replace(",", ".")
            );

            basePriceBRL = ((10.5 / 100) * T106BRLprice + T106BRLprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ",");
            basePriceUSD = ((10.5 / 100) * T106USDprice + T106USDprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ",");
          }
          console.log(
            { basePriceBRL, basePriceUSD, price },
            basePriceBRL === price.BRL
              ? Number(
                  parseFinance(
                    price.BRL,
                    "90 DIAS",
                    finance,
                    "BRL",
                    isMaterialZipper
                  ).replace(",", ".")
                )
              : basePriceBRL
          );
          const BRLprice =
            basePriceBRL === price.BRL
              ? Number(
                  parseFinance(
                    price.BRL,
                    "90 DIAS",
                    finance,
                    "BRL",
                    isMaterialZipper
                  ).replace(",", ".")
                )
              : Number(basePriceBRL.replace(",", "."));
          const USDprice =
            basePriceUSD === price.USD
              ? Number(
                  parseFinance(
                    price.USD,
                    "90 DIAS",
                    finance,
                    "USD",
                    isMaterialZipper
                  ).replace(",", ".")
                )
              : Number(basePriceUSD.replace(",", "."));

          const percentagemInBRL =
            (BRLprice * INCREMENTAL_PERCENTAGEM_IN_CREDIT_FORM) / 100;
          const percentagemInUSD =
            (USDprice * INCREMENTAL_PERCENTAGEM_IN_CREDIT_FORM) / 100;
          var itemPreco = {
            name: item,
            BRL: (percentagemInBRL + BRLprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
            USD: (percentagemInUSD + USDprice)
              .toFixed(decimalZipper)
              .toString()
              .replace(".", ","),
          };
        } else if (item == "T106 - 90 DIAS") {
          try {
            const decimalZipper = scope.material.MaterialZipper ? 4 : 2;

            if (hasT106) {
              const canShowt106 = false;
              var BRLprice = Number(
                parseFinance(
                  price.BRL,
                  "90 DIAS",
                  finance,
                  "BRL",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var USDprice = Number(
                parseFinance(
                  price.USD,
                  "90 DIAS",
                  finance,
                  "USD",
                  isMaterialZipper
                ).replace(",", ".")
              );

              var itemPreco = {
                name: item,
                BRL: ((10.5 / 100) * BRLprice + BRLprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
                USD: ((10.5 / 100) * USDprice + USDprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
              };

              // scope.onT106Change({value: { ...itemPreco, item: scope.material.MaterialCode }})
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          } catch (e) {
            var itemPreco = {
              name: item,
              BRL: "0",
              USD: "0",
            };
          }
        } else if (item == "T106 - 30 DIAS") {
          try {
            const decimalZipper = scope.material.MaterialZipper ? 4 : 2;

            if (hasT106) {
              var BRLprice = Number(
                parseFinance(
                  price.BRL,
                  "30 DIAS",
                  finance,
                  "BRL",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var USDprice = Number(
                parseFinance(
                  price.USD,
                  "30 DIAS",
                  finance,
                  "USD",
                  isMaterialZipper
                ).replace(",", ".")
              );

              var itemPreco = {
                name: item,
                BRL: ((10.5 / 100) * BRLprice + BRLprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
                USD: ((10.5 / 100) * USDprice + USDprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
              };
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          } catch (e) {
            var itemPreco = {
              name: item,
              BRL: "0",
              USD: "0",
            };
          }
        } else if (item == "T106 - 45 DIAS") {
          try {
            const decimalZipper = scope.material.MaterialZipper ? 4 : 2;

            if (hasT106) {
              var BRLprice = Number(
                parseFinance(
                  price.BRL,
                  "45 DIAS",
                  finance,
                  "BRL",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var USDprice = Number(
                parseFinance(
                  price.USD,
                  "45 DIAS",
                  finance,
                  "USD",
                  isMaterialZipper
                ).replace(",", ".")
              );

              var itemPreco = {
                name: item,
                BRL: ((10.5 / 100) * BRLprice + BRLprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
                USD: ((10.5 / 100) * USDprice + USDprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
              };
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          } catch (e) {
            var itemPreco = {
              name: item,
              BRL: "0",
              USD: "0",
            };
          }
        } else if (item == "T106 - 60 DIAS") {
          try {
            const decimalZipper = scope.material.MaterialZipper ? 4 : 2;

            if (hasT106) {
              var BRLprice = Number(
                parseFinance(
                  price.BRL,
                  "60 DIAS",
                  finance,
                  "BRL",
                  isMaterialZipper
                ).replace(",", ".")
              );
              var USDprice = Number(
                parseFinance(
                  price.USD,
                  "60 DIAS",
                  finance,
                  "USD",
                  isMaterialZipper
                ).replace(",", ".")
              );

              var itemPreco = {
                name: item,
                BRL: ((10.5 / 100) * BRLprice + BRLprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
                USD: ((10.5 / 100) * USDprice + USDprice)
                  .toFixed(decimalZipper)
                  .toString()
                  .replace(".", ","),
              };
            } else {
              var itemPreco = {
                name: item,
                BRL: "0",
                USD: "0",
              };
            }
          } catch (e) {
            var itemPreco = {
              name: item,
              BRL: "0",
              USD: "0",
            };
          }
        } else {
          var itemPreco = {
            name: item,
            BRL: parseFinance(
              price.BRL,
              item,
              finance,
              "BRL",
              isMaterialZipper
            ),
            USD: parseFinance(
              price.USD,
              item,
              finance,
              "USD",
              isMaterialZipper
            ),
          };
        }
        try {
          if (
            (scope.currency == "BRL" && itemPreco.name == "SALES") ||
            itemPreco.name == "PROMO"
          ) {
            if (
              parseFloat(itemPreco.BRL.replace(/\./g, "").replace(",", ".")) >
                0 ||
              parseFloat(itemPreco.BRL.replace(/\./g, "").replace(",", ".")) > 0
            ) {
              scope.activePrice = "activePrice";
            }
          }
          if (
            (scope.currency == "USD" && itemPreco.name == "SALES") ||
            itemPreco.name == "PROMO"
          ) {
            if (
              parseFloat(itemPreco.USD.replace(/\./g, "").replace(",", ".")) >
                0 ||
              parseFloat(itemPreco.USD.replace(/\./g, "").replace(",", ".")) > 0
            ) {
              scope.activePrice = "activePrice";
            }
          }
        } catch (e) {}

        return itemPreco;
      });
      return arrValues;
    }

    function parseFinance(
      price = 0,
      item,
      finance = {},
      curr,
      materialZipper = false
    ) {
      let prz = item.replace(/\D/g, "");

      price = ("" + price).replace(",", ".");
      price = price.replace(/\.(?![^.]+$)|[^0-9.]/, "");

      let parsedPrice = parseFloat(price, 10);

      const isMaterialZipperToFourDecimalPrice = materialZipper ? 4 : 2;

      const calculated = rulesService
        .calcFinancy(
          parsedPrice,
          prz,
          finance.FatorRedutor,
          finance["FatorFinanceiro" + curr],
          false
        )
        .toFixed(isMaterialZipperToFourDecimalPrice);

      return calculated;
    }
  }
})();
