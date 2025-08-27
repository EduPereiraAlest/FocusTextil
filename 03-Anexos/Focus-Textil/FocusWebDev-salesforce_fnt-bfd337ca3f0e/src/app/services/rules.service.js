/* global utils:true */
// SERVIÇO - REGRAS DE NEGÓCIO PARA MATERIAIS E CARRINHO DE COMPRAS
(() => {
  'use strict';
  angular.module('app').service('rulesService', rulesService);

  function rulesService() {
    const vm = this;
    vm.parseCurr = utils.helpers.parseCurr;


    return {
      calcFinancy: calcFinancy,
      checkMultiple: checkMultiple,
      checkStockLimits: checkStockLimits, // DEPRECATED
      checkMaterialStockLimits: checkMaterialStockLimits,
      checkStockDate: checkStockDate,
      checkStockType: checkStockType,
      overPrice: overPrice,
      checkStockCentro: checkStockCentro
    };

    function calcFinancy(Price, PrzMed, FatorRedutor, FatorFinanceiro, isSuframa) {
      if(isSuframa){
        var calc = Price * FatorRedutor
      }else{
      var calc = PrzMed <= 14 ?
        Price - Price * FatorRedutor :
        Price * Math.pow(FatorFinanceiro, PrzMed / 30);
      }

      return calc;
    }


    function checkMaterialStockLimits (limit, qtdMaterial, material, deadline, Editavel, isFutureSales, stocksAtc, DateAtcDelv) {
      const segmentsAcceptStockNormal = ['M', 'N', 'C']
      const typeAccetedInMaterial = !!segmentsAcceptStockNormal.find((seg) => seg === material.TpStockCode.toUpperCase())

      qtdMaterial = parseInt(qtdMaterial, 10);
      var stockCode = material.TpStockCode;
      var unid = material.UnidMed;
      if(material.Posex) material.Posex = Number(material.Posex)

      var tom;
      if (typeof material.TomIndex === "number") {
        tom = material.TomIndex;
      } else if (material.Stock.Tonalidade) {
        tom = material.Stock.Tonalidade;
      } else if (material.selectedTom){
        tom = material.selectedTom;
      } else {
        console.log(" ! ! ! TOM NÃO ENCONTRADO", material);
      }

      var centro;
      if (material.CentroSelecionado) {
        centro = material.CentroSelecionado;

      } else if (material.Centro) {
        centro = material.Centro;

      } else {
        console.log(" ! ! ! CENTRO NÃO ENCONTRADO", material);
      }

      var dispPE;

      
      if(isFutureSales && material.MaterialCode.endsWith('N') && material.Stock &&
        material.Stock[tom] &&
        material.Stock[tom][centro] && !material.Stock[tom][centro].QtdProntEntreg && centro === 'T101') {
          if(material.Stock[1] && material.Stock[1]['T104']) {
            centro = 'T104';
            material.Stock = [material.Stock[1]];
            if(material.Centros) {
              material.Centros = ['T104']
            }

            if (material.CentroSelecionado && material.CentroSelecionado === 'T101') {
              material.CentroSelecionado = centro;
            } else if (material.Centro) {
              material.Centro = centro;
            } else {
              console.log(" ! ! ! CENTRO NÃO ENCONTRADO", material);
            }
          }
        }

        if (material.MaterialCode.endsWith("N") && material.Tons) {
          const t104Ton = material.Tons.find((ton) => ton.centro === "T104");
          if (t104Ton) {
            material.Tons = [t104Ton];
            material.TomIndex = 0;

            centro = "T104";
            if (material.Centros) {
              material.Centros = ["T104"];
            }

            if (
              material.CentroSelecionado &&
              material.CentroSelecionado === "T101"
            ) {
              material.CentroSelecionado = centro;
            } else if (material.Centro) {
              material.Centro = centro;
            } else {
              console.log(" ! ! ! CENTRO NÃO ENCONTRADO", material);
            }
          }
        }
      if (
        material.Stock &&
        material.Stock[tom] &&
        material.Stock[tom][centro] &&
        material.Stock[tom][centro].QtdProntEntreg
      ) {
        dispPE = parseInt(material.Stock[tom][centro].QtdProntEntreg, 10);
      } else if (
        material.Stock &&
        typeof material.Stock.QtdProntEntreg !== 'undefined'
      ) {
        dispPE = parseInt(material.Stock.QtdProntEntreg, 10);

      } else {
        console.log("DISP PE NÃO ENCONTRADO!", material);
        dispPE = 0;
      }


      // Apenas usuarios com perfil para venda futura podem estar habilitados a colocar materiais mesmo com estoque zerado
      if (!limit && !isFutureSales) {
        return {
          Qtd: 0,
          Error: 'Parametro não pode ser nulo'
        };
      }

      const cloneMaterial = material
      cloneMaterial.Tonalidade ? null : cloneMaterial.Tonalidade = 'T0'

      // Centro 201 = materiais de monstruário.
      if(
        !isFutureSales &&
        !DateAtcDelv
        && qtdMaterial > cloneMaterial.QtdPETotal
        && typeAccetedInMaterial
        && cloneMaterial.Tipo !== 'CAR'
      ) {

        for (const stock of stocksAtc) {

          // Material sem segmentação
          if(stock.Tonalidade === 'NA') {
            if (stock.stockATC >= qtdMaterial ) {
              return {
                Qtd: 0,
                Error: 'Atenção!!! Selecionar a data de chegada do ATC.'
              }
            }
          } else {
            if (stock.tonalidade.toUpperCase() === cloneMaterial.Tonalidade.toUpperCase()) {
              if (stock.stockATC >= qtdMaterial ) {
                return {
                  Qtd: 0,
                  Error: 'Atenção!!! Selecionar a data de chegada do ATC.'
                }
              }
            }
          }
        }

        return {
          Qtd: 0,
          Error: 'ATENÇÃO!!! O item selecionado não tem disponibilidade'
        }
      }

      if (DateAtcDelv  && !isFutureSales && typeAccetedInMaterial) {
        const centerAndDataATC = DateAtcDelv.split(',')

        // Materiais sem segmentação
        if (cloneMaterial.tonalidadeKeys[0].name === 'NA') {

          const stocks = Object.values(cloneMaterial.Stock).map((obj) => {
            return {
              Center: Object.keys(obj)[0],
              ...Object.values(obj)[0]
            }
          })

          const stockByCenterSelected = stocks.find((stock) => stock.Center === cloneMaterial.CentroSelecionado)
          for (const stockCenter of cloneMaterial.Disp[stockByCenterSelected.SegmentoEstoque].ListDisp) {
            if (stockCenter.Centro === centerAndDataATC[1] && stockCenter.Date === centerAndDataATC[0]) {
              if (qtdMaterial > stockCenter.Qtde) {

                return {
                  Qtd: 0,
                  Error: 'ATENÇÃO!!! O item selecionado não tem disponibilidade'
                }
              }
            }
          }
        } else {
          // segmentação normal

          for (const stockCenter of cloneMaterial.Disp[cloneMaterial.Segmento].ListDisp) {
            if (stockCenter.Centro === centerAndDataATC[1] && stockCenter.Date === centerAndDataATC[0]) {
              if (qtdMaterial > stockCenter.Qtde) {

                return {
                  Qtd: 0,
                  Error: 'ATENÇÃO!!! O item selecionado não tem disponibilidade'
                }
              }
            }
          }
        }
      }


      // TODO: Tonalidade foi retirado, colocar antes de commitar
      if (isFutureSales && typeAccetedInMaterial && !DateAtcDelv && qtdMaterial > cloneMaterial.QtdPETotal) {

        if (stocksAtc.length > 0) {
          for (const stock of stocksAtc) {
            if (stock.stockATC > 0  && stock.tonalidade.toUpperCase() === cloneMaterial.Tonalidade.toUpperCase()) {
              return {
                Qtd: 0,
                Error: 'Atenção!!! Selecionar a data de chegada do ATC.'
              }
            }
          }
        }
      }


      if (_.has(limit.TpStockCode, stockCode)) {
        let qtdLimit = +limit.TpStockCode[stockCode][unid] || 0;
        if (stockCode === 'N') {
          if ((qtdMaterial < qtdLimit) && (qtdMaterial !== dispPE)) {
            return {
              Qtd: 0,
              Error: 'A quantidade mínima deve ser maior ou igual à ' + qtdLimit
            };
          }
          //Regra para travar quantidade de material acima do estoque disponivel
          //TO:DO Ativar para a proxima versão
          var QtdOrg = (material.QtdMaterialOrg == undefined) ? 0 : material.QtdMaterialOrg;
          var CheckStockATC = (material.StockATC == undefined) ? true : false;

          var CheckisPE = (material.isPE == undefined) ? true : false;


          if (Editavel && qtdMaterial != QtdOrg && dispPE != 0 && qtdMaterial > dispPE && CheckisPE) {
            //if (Editavel && qtdMaterial > material.QtdMaterialOrg) {
              if(dispPE != 0 && qtdMaterial > dispPE){
                return {
                  Qtd: 0,
                  Error: 'A quantidade máxima deve ser menor ou igual à ' + (dispPE)
                };
              }
              if(dispPE == 0){
                return {
                  Qtd: 0,
                  Error: 'Não há estoque disponível'
                };
              }
            }


          if (Editavel && qtdMaterial != QtdOrg && dispPE != 0 && qtdMaterial > dispPE && material.isPE) {
          //if (Editavel && qtdMaterial > material.QtdMaterialOrg) {
            if(dispPE != 0 && qtdMaterial > (material.QtdMaterialOld + dispPE)){
              return {
                Qtd: 0,
                Error: 'A quantidade máxima deve ser menor ou igual à ' + (material.QtdMaterial + dispPE)
              };
            }
            if(dispPE == 0){
              return {
                Qtd: 0,
                Error: 'Não há estoque disponível'
              };
            }
          }
          else if(Editavel && material.isPE && qtdMaterial != material.QtdMaterialOld && qtdMaterial > QtdOrg && qtdMaterial > dispPE  && dispPE == 0){
            return {
              Qtd: 0,
              Error: 'Não há estoque disponível'
            };
          }
          //TO:DO regra de estoque disponivel PE

          else if (Editavel && qtdMaterial != QtdOrg && QtdOrg != 0 && material.StockATC && !material.isPE){
            var dispCHECK = material.QtdMaterialOld + material.StockATC.Qtde;

            if(qtdMaterial > dispCHECK){
              return {
                Qtd: 0,
                Error: 'Não há estoque ATC disponível'
              };
            }
        }
        else if (Editavel && qtdMaterial != QtdOrg && material.DateAtcDelv && !CheckStockATC && qtdMaterial > material.QtdMaterialOld && !material.isPE){
            return {
              Qtd: 0,
              Error: 'Não há estoque ATC disponível'
            };
        }
        else if (Editavel && QtdOrg == 0 && material.DateAtcDelv && CheckStockATC && qtdMaterial > material.StockMATC && !material.isPE){
          return {
            Qtd: 0,
            Error: 'Não há estoque ATC disponível'
          };
        }
        else if (Editavel && material.DateAtcDelv && CheckStockATC && qtdMaterial > material.StockMATC && !material.isPE){
          return {
            Qtd: 0,
            Error: 'Não há estoque ATC disponível'
          };
        }
      }
        else if ((qtdMaterial > qtdLimit) && (qtdMaterial !== dispPE)) {
          return {
            Qtd: 0,
            Error: 'A quantidade máxima deve ser menor ou igual à ' + qtdLimit
          };
        }
      }

      if (limit.TpStockCode[stockCode] && limit.TpStockCode[stockCode].FreeShipping) {
        if (limit.TpStockCode[stockCode].FreeShipping.PaymentTerms.indexOf(deadline) > -1) {
          if (qtdMaterial > limit.TpStockCode[stockCode].FreeShipping[unid]) {
            // console.log("fr3f4534 qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]", qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]);
            return {
              Error: 'Venda gratuita acima da metragem permitida.'
            };
          } else {
            // console.log("fr3f4534 NÃO TEM qtdMaterial MAIOR", qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]);
          }
        } else {
          // console.log("fr3f4534 NÃO TEM deadline", deadline);
        }
      } else {
        // console.log("fr3f4534 NÃO TEM FreeShipping", limit, limit.TpStockCode[stockCode]);
      }

      return {
        Qtd: qtdMaterial
      };
    }

    function checkStockLimits(limit, qtdMaterial, stockCode, unid, deadline, isProfileFutureSale) {
      if (!limit) {
        return {
          Qtd: 0,
          Error: 'Parametro não pode ser nulo'
        };
      }

      if (_.has(limit.TpStockCode, stockCode)) {
        let qtdLimit = +limit.TpStockCode[stockCode][unid] || 0;
        if (stockCode === 'N') {
          if (qtdMaterial < qtdLimit) {
            return {
              Qtd: 0,
              Error: 'A quantidade mínima deve ser maior ou igual à ' + qtdLimit
            };
          }
          if (qtdMaterial < qtdLimit) {
            return {
              Qtd: 0,
              Error: 'A quantidade mínima deve ser maior ou igual à ' + qtdLimit
            };
          }
        } else if (qtdMaterial > qtdLimit) {
          return {
            Qtd: 0,
            Error: 'A quantidade máxima deve ser menor ou igual à ' + qtdLimit
          };
        }
      }

      if (limit.TpStockCode[stockCode] && limit.TpStockCode[stockCode].FreeShipping) {
        if (limit.TpStockCode[stockCode].FreeShipping.PaymentTerms.indexOf(deadline) > -1) {
          if (qtdMaterial > limit.TpStockCode[stockCode].FreeShipping[unid]) {
            // console.log("fr3f4534 qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]", qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]);
            return {
              Error: 'Venda gratuita acima da metragem permitida.'
            };
          } else {
            // console.log("fr3f4534 NÃO TEM qtdMaterial MAIOR", qtdMaterial, limit.TpStockCode[stockCode].FreeShipping[unid]);
          }
        } else {
          // console.log("fr3f4534 NÃO TEM deadline", deadline);
        }
      } else {
        // console.log("fr3f4534 NÃO TEM FreeShipping", limit, limit.TpStockCode[stockCode]);
      }


      return {
        Qtd: qtdMaterial
      };
    }

    function checkStockCentro(MaterialCode, Centro, qtdProntEntreg, isEdit, DateAtcDelv){

      if(!isEdit && Centro !== 'S201'){
        if(DateAtcDelv == undefined){
          if(qtdProntEntreg == 0){
            return {
              Error: '\u2022 '+ MaterialCode +': Não há estoque disponível no centro ('+ Centro +').'
            };
          }
        }
      }

      return {
        Error: false
      }
    }



    //TO:DO considerar estoque reservado
    function checkMultiple(
      qtdMaterial,
      qtdEstApos,
      PayCond,
      MaterialCode,
      qtdProntEntreg,
      qtdeMultiplo,
      corteMin,
      TpStockCode,
      Abgru,
      isEdit,
      qtdMaterialOrg,
      DateAtcDelv,
      StockATC,
      QtdMaterialOld,
      isPE) {


      let isZong;
      let queimaQtdEstApos;
      let queimaQtdPront;
      let pagtoAntecipado;
      var isMultiplo;
      let corteNum = 0;
      let MultiplePassTotal = 0;
      let isFTSlimpaEstoque = (qtdMaterialOrg != undefined) ? true : false;
      corteNum = parseInt(corteMin);


        //TO:DO check new item in edit order, check StockATC item object
      if (StockATC == undefined){
        if(!isPE){
          MultiplePassTotal = qtdEstApos;
        }
      }else{
        MultiplePassTotal = (isPE) ? (qtdProntEntreg + QtdMaterialOld) : (StockATC.Qtde + QtdMaterialOld);
      }




      if (qtdeMultiplo && qtdMaterial) {

        isMultiplo = (qtdMaterial % qtdeMultiplo) == 0;



        // validação pagamento antecipado
        if (PayCond == "A001") {
          pagtoAntecipado = true
        } else if (PayCond != "A001") {
          pagtoAntecipado = false
        }

        //   validaao isZong (código do material começa com z)
        if (MaterialCode.charAt(0) == "Z") {
          isZong = true;
        } else {
          isZong = false;
        }

        if (qtdMaterial == qtdEstApos) {
          if (corteNum == 0) {
            queimaQtdEstApos = true;
          } else {
            queimaQtdEstApos = false;
          }
        } else {
          queimaQtdEstApos = false;
        }

        if (qtdMaterial == qtdProntEntreg) {
          if (corteNum == 0) {
            queimaQtdPront = true
          } else {
            queimaQtdPront = false;
          }
        } else {
          queimaQtdPront = false;
        }

        if (Abgru == '') {
          let tipoEstoque = TpStockCode.toLowerCase();
          let pilotagem = tipoEstoque.charAt(0) == "p"
          let cartela = tipoEstoque.charAt(0) == "c"

          if (qtdeMultiplo) {

            if (!queimaQtdEstApos) {

              if (!queimaQtdPront) {

                if (isZong) {

                  if(MultiplePassTotal != qtdMaterial){

                    if (qtdeMultiplo > 0 && !isMultiplo) {
                      return {
                        Error: '\u2022 A quantidade do material ' + MaterialCode + ' ' + 'deve ser multiplo de ' + ' ' + qtdeMultiplo + '<br />'
                      };
                    } else {
                      return {
                        Qtd: qtdMaterial
                      };
                    }
                  }
                  else{
                    return {
                      Qtd: qtdMaterial
                    };
                  }

                }


                if (!pilotagem && !cartela) {
                  if (!isZong && corteNum > 0) {
                    if (qtdMaterial < corteNum) {
                      console.log("===== REgra de multiplo/minimo")
                      console.log(qtdMaterial)
                      console.log(qtdProntEntreg)
                      if(isEdit){
                        if(qtdMaterial == qtdProntEntreg || qtdMaterial == qtdMaterialOrg){
                          return {
                            Qtd: qtdMaterial
                          }
                        }else{
                          return {
                            Error: '\u2022 A quantidade do material ' + MaterialCode + ' ' + 'deve ser igual ou maior ao corte mínimo ' + ' ' + parseInt(corteMin) + '<br />'
                          };
                        }
                      }else{
                        if(qtdMaterial == qtdProntEntreg){
                          return {
                            Qtd: qtdMaterial
                          }
                        }else{
                          return {
                            Error: '\u2022 A quantidade do material ' + MaterialCode + ' ' + 'deve ser igual ou maior ao corte mínimo ' + ' ' + parseInt(corteMin) + '<br />'
                          };
                        }
                      }

                    } else {
                      return {
                        Qtd: qtdMaterial
                      };
                    }
                  } else {
                      if(isFTSlimpaEstoque){
                        if(MultiplePassTotal != qtdMaterial && DateAtcDelv && qtdMaterial != QtdMaterialOld){
                          if (qtdeMultiplo > 0 && !isMultiplo) {
                            return {
                              Error: '\u2022 Material' + ' ' + MaterialCode + ' ' + 'não sujeito a corte, a quantidade deve ser multiplo de ' + ' ' + qtdeMultiplo + '<br />'
                            };
                          } else {
                              return {
                                Qtd: qtdMaterial
                              };
                           }
                          }
                          else{
                            if(isPE){
                              if (MultiplePassTotal == qtdMaterial){
                                return {
                                  Qtd: qtdMaterial
                                };
                              }else{
                                if (qtdeMultiplo > 0 && !isMultiplo) {
                                  return {
                                    Error: '\u2022 Material' + ' ' + MaterialCode + ' ' + 'não sujeito a corte, a quantidade deve ser multiplo de ' + ' ' + qtdeMultiplo + '<br />'
                                  };
                                } else {
                                    return {
                                      Qtd: qtdMaterial
                                    };
                                }
                              }
                            }
                          }
                    }else{
                      if (qtdeMultiplo > 0 && !isMultiplo) {
                        return {
                          Error: '\u2022 Material' + ' ' + MaterialCode + ' ' + 'não sujeito a corte, a quantidade deve ser multiplo de ' + ' ' + qtdeMultiplo + '<br />'
                        };
                      } else {
                          return {
                            Qtd: qtdMaterial
                          };
                       }
                    }
                  }

                } else {
                  return {
                    Qtd: qtdMaterial
                  };
                }



              } else {
                return {
                  Qtd: qtdMaterial
                };
              }
            } else {
              return {
                Qtd: qtdMaterial
              };
            }
          }
        } else {
          return {
            Qtd: qtdMaterial
          };
        }
      } else {
        return {
          Qtd: qtdMaterial
        };
      }
    }


    function checkStockDate(DateOutVend) {
      if (DateOutVend) {
        return false;
      }

      let numbers = DateOutVend.match(/\d+/g);
      let date = new Date(numbers[2], numbers[0] - 1, numbers[1]);

      return date < _.now() ? {
        Qtd: 0,
        Error: 'Venda fechada.'
      } : {};
    }

    function checkStockType(qtd, items, type) {
      let test =
        type === 'C' ?
        _(items).every(material => material.TpStockCode === type) :
        _(items).every(material => material.TpStockCode !== 'C');

      return test ? {
        Qtd: qtd
      } : {
        Qtd: 0,
        Error: 'Você inseriu um produto incompatível com o estoque do carrinho.' +
          ' Para comprar produtos deste estoque é necessário limpar seu carrinho.'
      };
    }

    function overPrice(tprice, cprice, ovp) {
      let parsedPrice = parseFloat(tprice, 10);

      return parsedPrice + parseFloat(parsedPrice * ovp / 100, 10) < parseFloat(cprice, 10) ? {
        Error: 'Valor maior que o permitido.'
      } : {};
    }
  }
})();
