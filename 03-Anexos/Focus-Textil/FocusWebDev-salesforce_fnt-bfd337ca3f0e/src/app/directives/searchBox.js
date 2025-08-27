(function () {
  'use strict';
  angular.module('app').directive('searchBox', searchBox);

  function searchBox() {
    return {
      scope: {},
      replace: true,
      transclude: true,
      controller: searchBoxController,
      controllerAs: 'ctrl',
      bindToController: {
        model: '=',
        title: '@',
        info: '@',
        send: '&',
        clear: '&',
        focus: '&'
      },
      templateUrl: 'app/directives/searchBox.html'
    };



    function searchBoxController($scope, $location, $compile) {
      $scope.initQrCode = initQrCode;
      $scope.qrcode = {
        isActive: false,
      }
      $scope.$location = $location;

      function onMediaDevice () {
        return new Promise((resolve, reject) => {
          navigator.permissions.query({name: 'camera'})
          .then(function (permissionStatus) {
            navigator.mediaDevices.getUserMedia({ video: { width: 1280 } })
            .then(function (stream) {
              // É importante parar o stream aqui para não deixar a câmera ligada.
              resolve({ hasCamera: true, hasPermission: true, success: true });
            })
            .catch(function (error) {
              resolve({ hasCamera: true, hasPermission: false, success: false });
            });
          }).catch(function (error) {
            resolve({ hasCamera: true, hasPermission: false, success: false });
          });
        })
      }

      function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      function checkDeviceSupport() {
        if (!isMobileDevice()) return onMediaDevice()

        return new Promise((resolve) => {
          if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            resolve({ hasCamera: false, success: false });
            return;
          }

          navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
              // É importante parar o stream aqui para não deixar a câmera ligada.
              stream.getTracks().forEach(track => track.stop());
              resolve({ hasCamera: true, hasPermission: true, success: true });
            })
            .catch(function (error) {
              resolve({ hasCamera: true, hasPermission: false, success: false });
            });
        });
      };

      $scope.qrcode.checkDeviceSupport = checkDeviceSupport;

      function setupVideo() {
        $scope.qrcode.checkDeviceSupport().then((response) => {
          if (response.success === false) return;

          window.html5QrcodeScanner = new Html5QrcodeScanner('qr-code-block-inner', {
            fps: 10
          });

          document.getElementById('stop-video').classList.remove('d-none');
          document.getElementById('setup-video').classList.add('d-none');
          try {
            document.getElementById('qrcodeimg').classList.add('d-none');
            // html5QrcodeScanner.render(onScanSuccess, onScanFailure);

            window.html5QrcodeScanner.render(function (result) { // scan qr-code with success
              document.getElementById('qrcodeimg').classList.remove('d-none');
              stopVideo();
              $scope.qrcode.isActive = !$scope.qrcode.isActive;
              if (result !== '') {
                $scope.ctrl.model = result;
                document.getElementById('search-box-text').value = result;
                document.getElementById('search-box-text').dispatchEvent(new Event('input', { bubbles: true }));
                document.getElementById('search-box-text').dispatchEvent(new Event('change', { bubbles: true }));
                $scope.ctrl.send();
              }
            }, function (error) {
              if (error) {
                if (error.includes('No MultiFormat')) return;
                stopVideo();
                const headerTextElement = document.getElementById('qrcode-header-msg');
                let headerMessage = error;
                if ((/(permission|denied).+?(permission|denied)/i).test(headerMessage)) {
                  headerMessage = 'denied';
                }
                if ((/qr code parse error/i).test(headerMessage)) {
                  headerMessage = 'QR code parse error';
                }
                if ((/NotReadableError/i).test(headerMessage) || (/Could not start video source/i).test(headerMessage)) {
                  headerMessage = 'NotReadableError';
                }
                if ((/MediaStreamError/i).test(headerMessage)) {
                  headerMessage = 'MediaStreamError';
                }
                headerMessage = 'unable to query supported devices.'

                document.getElementById('qrcodeimg').classList.remove('d-none');
                html5QrcodeScanner.clear();
                switch (headerMessage) {
                  case 'unable to query supported devices.': // VOCÊ PRECISA ESTAR EM HTTPS
                    if (headerTextElement) headerTextElement.innerHTML = 'Você precisa estar em HTTPS';
                    document.getElementById('setup-video').classList.add('d-none');
                    break;
                  case 'denied':
                    //colocar o resto aki
                    if (headerTextElement) headerTextElement.innerHTML = 'Permissão de câmera negada';
                    document.getElementById('setup-video').classList.add('d-none');
                    break;
                }
              }
            });
          } catch (e) {
            console.error(e);
            stopVideo();
            document.getElementById('qrcodeimg').classList.remove('d-none');
            const headerTextElement = document.getElementById('qrcode-header-msg');
            if (headerTextElement) headerTextElement.innerHTML = 'Não é possível acessar a câmera, tente escanear via imagem.';
            if (html5Qrcode) html5QrcodeScanner.clear();
            if (html5Qrcode) html5Qrcode.clear();
            navigator.mediaDevices.getUserMedia({ audio: false, video: true })
              .catch(function (err) {
                console.error(err);
                const headerTextElement = document.getElementById('qrcode-header-msg');
                if (headerTextElement) headerTextElement.innerHTML = 'Sem permissão para utilizar a câmera';
              });
          }
        });
      }

      function stopVideo() {
        if (window.html5QrcodeScanner) window.html5QrcodeScanner.clear();
        if (window.html5Qrcode) window.html5Qrcode.clear();
        document.getElementById('qrcodeimg').classList.remove('d-none')
        document.getElementById('stop-video').classList.add('d-none');
        document.getElementById('setup-video').classList.remove('d-none');
      }

      function sendFile(event) {
        if (!event.target.files.length) return;
        if (window.html5QrcodeScanner) window.html5QrcodeScanner.clear();
        setTimeout(() => {
          window.html5Qrcode = new Html5Qrcode('qr-code-block-inner');
          html5Qrcode.scanFile(event.target.files[0]).then((result) => {
            $scope.ctrl.model = result;
            document.getElementById('search-box-text').value = result;
            document.getElementById('search-box-text').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('search-box-text').dispatchEvent(new Event('change', { bubbles: true }));
            $scope.ctrl.send();
            html5Qrcode.clear();
            $scope.qrcode.isActive = !$scope.qrcode.isActive;
          }).catch((error) => {
            // handle scan failure, usually better to ignore and keep scanning
            // console.warn(error);
            html5QrcodeScanner.clear();
            const headerTextElement = document.getElementById('qrcode-header-msg');
            if (headerTextElement) headerTextElement.innerHTML = 'Ocorreu um erro ao processar arquivo, tente novamente.';
            console.log("Error sendFile qrCode", error)
          });
        }, 50)
      }
      function closeQrCode() {
        if (window.html5QrcodeScanner) window.html5QrcodeScanner.clear();
        if (window.html5Qrcode) window.html5Qrcode.clear();
        document.getElementById('qrcodeimg').classList.remove('d-none');
        $scope.qrcode.isActive = !$scope.qrcode.isActive;
        document.getElementById('stop-video').classList.add('d-none');
        document.getElementById('setup-video').classList.remove('d-none');
      }

      $scope.qrcode.checkDeviceSupport = checkDeviceSupport;

      function setupVideo() {
        $scope.qrcode.checkDeviceSupport().then((response) => {
          if (response.success === false) return;
          window.html5QrcodeScanner = new Html5QrcodeScanner('qr-code-block-inner', {
            fps: 10
          });
          try {
            document.getElementById('qrcodeimg').classList.add('d-none');
            window.html5QrcodeScanner.render(function (result) { // scan qr-code with success
              html5QrcodeScanner.clear();
              // $QRCodeBlock.removeClass('with-video');
              // $QRCodeBlock.addClass('d-none');
              document.getElementById('qrcodeimg').classList.remove('d-none');
              $scope.qrcode.isActive = !$scope.qrcode.isActive;
              if (result !== '') {
                $scope.ctrl.model = result;
                document.getElementById('search-box-text').value = result;
                document.getElementById('search-box-text').dispatchEvent(new Event('input', { bubbles: true }));
                document.getElementById('search-box-text').dispatchEvent(new Event('change', { bubbles: true }));
                $scope.ctrl.send();
              }
            }, function (error) {
              // handle scan failure, usually better to ignore and keep scanning
              // // console.warn(error);

              console.log(error)
              if (error) {
                if(headerMessage.contains('No MultiFormat')) return;
                const headerTextElement = document.getElementById('qrcode-header-msg');
                let headerMessage = error;
                if ((/(permission|denied).+?(permission|denied)/i).test(headerMessage)) {
                  headerMessage = 'denied';
                };
                if ((/qr code parse error/i).test(headerMessage)) {
                  headerMessage = 'QR code parse error';
                };
                if ((/NotReadableError/i).test(headerMessage) || (/Could not start video source/i).test(headerMessage)) {
                  headerMessage = 'NotReadableError';
                };
                if ((/MediaStreamError/i).test(headerMessage)) {
                  headerMessage = 'MediaStreamError';
                };
                headerMessage = 'unable to query supported devices.'

                document.getElementById('qrcodeimg').classList.remove('d-none');
                switch (headerMessage) {
                  case 'unable to query supported devices.': // VOCÊ PRECISA ESTAR EM HTTPS
                    headerTextElement.innerHTML = 'Você precisa estar em HTTPS';
                    break;
                }
              }
            })
          } catch (e) {
            console.error(e);
            document.getElementById('qrcodeimg').classList.remove('d-none');
            html5QrcodeScanner.clear();
            navigator.mediaDevices.getUserMedia({ audio: false, video: true })
              .then(function (t) {
                // console.log(t)
                // setupVideo();
              })
              .catch(function (err) {
                console.error(err)
                const headerTextElement = document.getElementById('qrcode-header-msg');
                headerTextElement.innerHTML = 'Sem permissão para utilizar a câmera';
              });
          }
        });
      };
      function sendFile(event) {
        if (!event.target.files.length) return;
        if (window.html5QrcodeScanner) window.html5QrcodeScanner.clear();
        setTimeout(() => {
          window.html5Qrcode = new Html5Qrcode('qr-code-block-inner');
          html5Qrcode.scanFile(event.target.files[0]).then((result) => {
            $scope.ctrl.model = result;
            document.getElementById('search-box-text').value = result;
            document.getElementById('search-box-text').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('search-box-text').dispatchEvent(new Event('change', { bubbles: true }));
            $scope.ctrl.send();
            html5Qrcode.clear();
            $scope.qrcode.isActive = !$scope.qrcode.isActive;
          }).catch((error) => {
            // handle scan failure, usually better to ignore and keep scanning
            // console.warn(error);
            console.log(error)
          });
        }, 50)
      }
      function closeQrCode() {
        if (window.html5QrcodeScanner) window.html5QrcodeScanner.clear();
        if (window.html5Qrcode) window.html5Qrcode.clear();
        document.getElementById('qrcodeimg').classList.remove('d-none');
        $scope.qrcode.isActive = !$scope.qrcode.isActive;
      }

      function initQrCode() {
        $scope.qrcode.isActive = !$scope.qrcode.isActive;
        if (!$scope.qrcode.isActive) window.html5QrcodeScanner.clear();
        $scope.qrcode.checkDeviceSupport().then((response) => {
          if (response.success === false) {
            const headerTextElement = document.getElementById('qrcode-header-msg');
            if (headerTextElement) headerTextElement.innerHTML = 'Sem permissão para utilizar a câmera, escaneie via imagem';
          };
        });
        console.log($scope)
      }

      $scope.qrcode.closeQrCode = closeQrCode;
      $scope.qrcode.setupVideo = setupVideo;
      $scope.qrcode.stopVideo = stopVideo;
      $scope.sendFile = sendFile;
    }
  }
})();
