(() => {
    'use strict';
    angular.module('app').factory('ModelBuilder', () => {
        'use strict';
        return {
            buildModelList: (list, configObj, params) => {
                const modelList = [];

                angular.forEach(list, item => {
                    const model = {};

                    for (let key in configObj) {
                        if (configObj.hasOwnProperty(key) && angular.isFunction(configObj[key])) {
                            model[key] = configObj[key](item, params);
                        }
                    }

                    modelList.push(model);
                });
                return modelList;
            }
        };
    });
})();
