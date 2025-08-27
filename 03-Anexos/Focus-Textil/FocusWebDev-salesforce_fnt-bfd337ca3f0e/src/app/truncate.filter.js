(function() {
    'use strict';
    angular
        .module('app')
        .filter('characters', function() {
            return (input, chars, breakOnWord) => {
                if (isNaN(chars)) return input;
                if (chars <= 0) return '';
                if (input && input.length >= chars) {
                    input = input.substring(0, chars);

                    if (breakOnWord) {
                        while (input.charAt(input.length - 1) === ' ') {
                            input = input.substr(0, input.length - 1);
                        }
                    } else {
                        let lastspace = input.lastIndexOf(' ');

                        if (lastspace !== -1) {
                            input = input.substr(0, lastspace);
                        }
                    }
                    return input + '...';
                }
                return input;
            };
        })
        .filter('words', function() {
            return (input, words) => {
                if (isNaN(words)) return input;
                if (words <= 0) return '';
                if (input) {
                    let inputWords = input.split(/\s+/);

                    if (inputWords.length > words) {
                        input = inputWords.slice(0, words).join(' ') + '...';
                    }
                }
                return input;
            };
        })
        .filter('capitalize', function() {
            return function(text, scope) {
              if (text!=null)
              text = text.toLowerCase();
              return text.substring(0,1).toUpperCase()+text.substring(1);
            }
          });
})();
