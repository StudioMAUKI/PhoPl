angular.module('phopl.directives')
.directive('expandingTextarea', ['$ionicModal', function ($ionicModal) {
    return {
      restrict: 'A',
      scope: {
        content: '='
      },
      link: function($scope, element) {
        console.log('expandingTextarea started!');


        $scope.open = function() {
          $ionicModal.fromTemplateUrl('js/modal.note.html', {
            scope: $scope,
            focusFirstInput: true
          })
          .then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
            var iframeDocument = document.getElementById('editor').contentDocument;
            iframeDocument.designMode = 'on';
            if ($scope.content !== '메모를 남기세요.') {
              $(iframeDocument).find('body').append($scope.content);
            } else {
              // $(iframeDocument).find('body').append('공유할 사진과 장소에 대해 이야기해 주세요.<br>해시태그(#)를 활용하실 수 있습니다.');
            }
          });

        };

        $scope.close = function() {
          // if (window.cordova && window.cordova.plugins.Keyboard.isVisible) {
          //   window.cordova.plugins.Keyboard.close();
          // }

          var contentText = $('#editor').contents().find('body').text();
          if (contentText.trim().length === 0) {
            $scope.content = '메모를 남기세요.';
          } else {
            $scope.content = $('#editor').contents().find('body').html();
          }
          $scope.modal.hide();
          $scope.modal.remove();
        };

        element[0].addEventListener('click', function(event) {
          $scope.open();
        });
      }
    };
}])
.directive('locationSuggestion', ['$ionicModal', 'LocationService', 'MapService', function($ionicModal, LocationService, MapService){
  return {
    restrict: 'A',
    scope: {
      location: '='
    },
    link: function($scope, element){
      // console.log('locationSuggestion started!');
      $scope.search = {};
      $scope.search.suggestions = [];
      $scope.search.query = "";
      $ionicModal.fromTemplateUrl('js/modal.location.html', {
        scope: $scope,
        focusFirstInput: true
      }).then(function(modal) {
        $scope.modal = modal;
      });
      $ionicModal.fromTemplateUrl('js/modal.map.html', {
        scope: $scope,
        focusFirstInput: true
      }).then(function(modal) {
        $scope.modalMap = modal;
      });
      $scope.mapCenterCoord = {
        lat: 0.0,
        lng: 0.0
      };

      element[0].addEventListener('click', function(event) {
        $scope.open();
      });

      $scope.$watch('search.query', function(newValue) {
        if (newValue) {
          LocationService.searchAddress(newValue)
          .then(function(result) {
            console.log('suggestions', result);
            $scope.search.error = null;
            for (var i = 0; i < result.length ; i++) {
              result[i].name = result[i].terms[0].value;
              result[i].region = '';
              for (var j = result[i].terms.length - 1; j > 0; j--) {
                result[i].region += result[i].terms[j].value + ' ';
              }
            }
            $scope.search.suggestions = result;
          }, function(status){
            $scope.search.error = "There was an error :( " + status;
          });
        };
        $scope.open = function() {
          return $scope.modal.show();
        };
        $scope.close = function() {
          return $scope.modal.hide();
        };
        $scope.choosePlace = function(place) {
          if (place.place_id !== -1) {
            LocationService.getDetails(place.place_id)
            .then(function(location) {
              $scope.location = location;
              console.info('selected location', location);
              $scope.location.type = 'google';
              $scope.location.lps = $scope.location.place_id + '.google';
              $scope.close();
            });
          } else {
            $scope.location.type = 'mauki';
            $scope.location.name = place.name;
            $scope.location.lps = null;
            $scope.close()
            .then(function() {
              $scope.openMap();
            });
          }
        };

        //  Part of modal map
        function fitMapToScreen() {
          console.log('call fitMapToScreen');
      		var documentHeight = $(document).height();
          // var contentHeight = document.getElementsByTagName('ion-content')[0].clientHeight;
          console.info('documentHeight: ' + documentHeight);
      		var barHeight = document.getElementsByTagName('ion-header-bar')[0].clientHeight || 44;
          $('#map').css({
      			height: documentHeight - barHeight
      		});
          //  이거 꼭 해줘야 지도가 제대로 그려짐. (안그러면 걍 회색으로 나옴)
          // google.maps.event.trigger($scope.map, 'resize');
      	}
        function initMap(pos) {
          pos = pos || {
            latitude: 37.5666103,
            longitude: 126.9783882
          };
          $scope.mapCenterCoord.lat = pos.latitude;
          $scope.mapCenterCoord.lng = pos.longitude;
          if ($scope.map) {
            $scope.map.setCenter({
              lat: pos.latitude,
              lng: pos.longitude
            });
            return;
          }
          $scope.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: pos.latitude, lng: pos.longitude},
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: false,
        		mapTypeControl: false,
        		streetViewControl: false
          });
          $scope.curMarker = new google.maps.Marker({
            map: $scope.map,
            position: { lat: pos.latitude, lng: pos.longitude },
            draggable: true,
            zIndex: 9999
          });
          $scope.map.addListener('center_changed', function() {
            console.info('map center_changed');
            var mapCenter = $scope.map.getCenter();
            $scope.curMarker.setPosition({
              lat: mapCenter.lat(),
              lng: mapCenter.lng()
            });
            $scope.mapCenterCoord = {
              lat: mapCenter.lat(),
              lng: mapCenter.lng()
            };
          });
          $scope.curMarker.addListener('dragend', function(event) {
            console.info('marker dragend : ' + event.latLng.lat(), event.latLng.lng());
            $scope.map.setCenter(event.latLng);
          });
        }
        $scope.openMap = function() {
          $scope.modalMap.show()
          .then(function() {
            MapService.getCurrentPosition()
            .then(function(pos) {
              fitMapToScreen();
              initMap(pos);
            }, function(err) {
              console.error(err);
              fitMapToScreen();
              initMap();
            });
          });
        };
        $scope.closeMap = function() {
          $scope.location.geometry = {
            location : {
              lat : function() { return $scope.mapCenterCoord.lat;},
              lng : function() { return $scope.mapCenterCoord.lng;}
            }
          };
          MapService.getCurrentAddress($scope.mapCenterCoord.lat, $scope.mapCenterCoord.lng)
          .then(function(res) {
            $scope.location.formatted_address = res.roadAddress.name || res.jibunAddress.name || res.region;
            return $scope.modalMap.hide();
          });
        };
      });
    }
  }
}]);
