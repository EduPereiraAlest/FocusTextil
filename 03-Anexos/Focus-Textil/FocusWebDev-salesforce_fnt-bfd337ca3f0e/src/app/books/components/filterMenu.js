let filtersData;

(function() {
  'use strict';

  const filterBook = {
    transclude: true,
    controller: filterBookController,
    bindings: {
      query: '=',
      range: '=',
      disabled: '=',
      onConfirm: '&',
      onClear: '&'
    },
    templateUrl: 'app/books/components/filterMenu.html'
  };

  /* @ngInject */
  filterBookController.$inject = ['$timeout', 'localService'];

  function filterBookController($timeout, localService) {
    var self = this;

    filtersData = localService.getData('filterload');

    this.filters = filtersData;
    this.filterMenuOpen = false;
    this.filterMenuEmpty = checkFilters(this.filters);
    this.activeFiltersCount = 0;
    this.menuActive = '';
    this.sliderControl = false;
    this.slider = {
      min: 0,
      max: 1000,
      options: {
        showTicks: true,
        showTicksValues: true,
        step: 100,
        floor: 0,
        ceil: 1000,
        onChange: function() {
          this.filterMenuEmpty = !this.checkSlider() && checkFilters(this.filters);
          return;
        }.bind(this)
      }
    };

    $timeout(() => {
      if (this.query) {
        this.filterMenuEmpty = false;
        parseFilters(this.query, this.filters);
      }
      if (this.range) {
        this.filterMenuEmpty = false;
        let [min, max] = this.range.split(':');
        let slider = { ...this.slider, min, max };

        this.slider = slider;
      }

      this.onClear({ cleaner: this.clearFilters.bind(this) });

      this.activeFiltersCount = countActiveFilters(this.filters);
    });

    this.menuOpen = menu => {
      this.sliderControl = false;

      if (this.menuActive === menu) {
        this.menuActive = '';
      } else {
        this.menuActive = menu;
      }

      if (this.menuActive === 'grama') {
        return $timeout(() => (this.sliderControl = true), 250);
      }

      return false;
    };

    this.toggleMenuFilter = () => {
      this.filterMenuOpen = !this.filterMenuOpen;
      this.menuActive = '';

      return this.filterMenuOpen ? parseFilters(this.query, this.filters) : false;
    };

    this.toggleFilter = item => {
      item.active = !item.active;
      this.activeFiltersCount = countActiveFilters(this.filters);
      this.filterMenuEmpty = !this.checkSlider() && checkFilters(this.filters,this);
    };

    this.countItems = values => _.where(values, { active: true }).length;

    this.checkSlider = () => this.slider.max - this.slider.min !== 1000;

    this.applyFilters = () => {
      let filterQuery = stringfyFilters(this.filters);

      if (filterQuery.length) {
        this.query = '(' + filterQuery.join(')(') + ')';
        this.filterMenuOpen = false;
      }

      if (this.checkSlider()) {
        this.range = this.slider.min + ':' + this.slider.max;
        this.filterMenuOpen = false;
      }

      return $timeout(this.onConfirm, 0);
    };

    this.clearMenu = () => {
      this.clearFilters();
      return $timeout(this.onConfirm);
    };

    this.clearFilters = () => {
      setFilters(this.filters);

      this.filterMenuEmpty = checkFilters(this.filters);
      this.filterMenuOpen = false;
      this.menuActive = '';
      this.query = '';

      this.slider.max = 1000;
      this.slider.min = 0;
      this.range = '';

      this.activeFiltersCount = 0;
    };
  }

  angular.module('app').component('filterBook', filterBook);

  function setFilters(filterData, filterList) {
    let id, menu;

    _.each(filterData, ({ att, values }) => {
      if (filterList) {
        menu = _.findWhere(filterList, { att: att });
      }
      _.each(values, filterItem => {
        id = cleanStr(filterItem.id);

        if (menu && menu.values.includes(id)) {
          filterItem.active = true;
        } else {
          filterItem.active = false;
        }
      });
    });

  }

  function cleanStr(string) {
    return (""+string)
      .replace(/[/\. ,:-]+/g, '')
      .removeAccents();
  }

  function checkFilters(currentFilters, exposed) {
    let isAllUnselected = _.every(currentFilters, filterMenu => {
      let filterSelecteds = filterActives(filterMenu);
      return filterSelecteds.length === 0;
    });
    
    if (isAllUnselected && exposed) {
      exposed.query = '';
    }
    
    return isAllUnselected;
  }

  function filterActives({ values }) {
    var actives = _.where(values, {
      active: true
    });
    return actives;
  }

  function stringfyFilters(filterMenus) {
    let filterSelecteds;
    let filterQuery = [];

    angular.forEach(filterMenus, filterMenu => {
      filterSelecteds = filterActives(filterMenu);
      if (filterSelecteds.length) {
        filterQuery.push(stringfyItems(filterMenu, filterSelecteds));
      }
    });

    return filterQuery;
  }

  function stringfyItems(filterMenu, filterSelecteds) {
    let filterParsed = filterSelecteds.map(
      filterItem => 'Master.FilterNavig.' + cleanStr(filterMenu.att) + ':' + cleanStr(filterItem.id)
    );

    return filterParsed.join('|');
  }

  function parseFilters(filterStr, filterData) {
    let menu;

    let filterList = filterStr
      .replace(/[|]/g, ')(')
      .split('(')
      .filter(val => val.indexOf(')') > -1)
      .map(val => val.replaceAll('Master.FilterNavig.', '').split(')')[0]);

    const parsedFilter = filterList.reduce((parsedList, filterItem) => {
      let [att, value] = filterItem.split(':');

      menu = _.findWhere(parsedList, { att });

      if (menu && menu.att === att) {
        menu.values.push(value);
      } else {
        parsedList.push({ att, values: [value] });
      }
      return parsedList;
    }, []);

    return setFilters(filterData, parsedFilter);
  }

  function countActiveFilters(filterData) {
    if ( ! filterData) return 0;
    let activeCount = filterData
      .filter(function (rootFilter) {
        let items = filterActives(rootFilter).length;
        rootFilter.activeCount = items;
        return items > 0;
      })
      .map(x => x.activeCount)
      .reduce((x, y) => x + y, 0)
    ;

    return activeCount;
  }
})();


