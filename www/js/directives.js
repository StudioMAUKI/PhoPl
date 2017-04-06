angular.module('phopl.directives')

.directive('policyBasic', function() {
  return {
    templateUrl:'config/policies.basic.content.html'
  };
})
.directive('policyPrivacy', function() {
  return {
    templateUrl:'config/policies.privacy.content.html'
  };
})
.directive('expandingTextarea', ['$ionicModal', function ($ionicModal) {
    return {
      restrict: 'A',
      scope: {
        content: '='
      },
      link: function($scope, element) {
        console.log('expandingTextarea started!');
        $scope.isOS = function() {
          return ionic.Platform.isIOS();
        }

        $scope.open = function() {
          $ionicModal.fromTemplateUrl('js/modal.note.html', {
            scope: $scope,
            focusFirstInput: true
          })
          .then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();

            if ($scope.content === '메모를 남기세요.') {
              $('#editor-note').val('');
            } else {
              $('#editor-note').val($scope.content);
            }
          });
        };

        $scope.close = function() {
          var contentText = $('#editor-note').val();
          if (contentText.length === 0) {
            $scope.content = '메모를 남기세요.';
          } else {
            // $scope.content = contentText.replace(/\n/g, '<br>');
            $scope.content = contentText;
          }
          console.debug('content', contentText);
          $scope.modal.hide();
          $scope.modal.remove();
        };

        element[0].addEventListener('click', function(event) {
          $scope.open();
        });
      }
    };
}])
.directive('locationSuggestion', ['$ionicScrollDelegate','$ionicPlatform', '$ionicModal', 'LocationService', 'MapService', function($ionicScrollDelegate,$ionicPlatform, $ionicModal, LocationService, MapService){
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
      // $ionicModal.fromTemplateUrl('js/modal.map.html', {
      //   scope: $scope,
      //   focusFirstInput: true
      // }).then(function(modal) {
      //   $scope.modalMap = modal;
      // });
      $scope.mapCenterCoord = {
        lat: 0.0,
        lng: 0.0
      };

      element[0].addEventListener('click', function(event) {
        $scope.open();
      });

      $scope.viewMap= function(place){
        if(place.type == 'daum'){
          $scope.showMap({ latitude: Number(place.lat), longitude: Number(place.lng)});
        }
        else if(place.type == 'google'){
           LocationService.getDetails(place.place_id)
            .then(function(location) {
              // console.log("lat :" + location.geometry.location.lat());
              // console.log("lng :" + location.geometry.location.lng());

              $scope.showMap({ latitude: Number(location.geometry.location.lat() ), longitude: Number(location.geometry.location.lng() )});
            });
        }

      };

      $scope.$watch('search.query', function(newValue) {
        if (newValue) {

             LocationService.searchAddress(newValue)
            .then(function(result) {
              console.log('suggestions', result);
              $scope.search.error = null;
              for (var i = 0; i < result.length ; i++) {
                // result[i].name = result[i].terms[0].value;
                // result[i].region = '';
                // for (var j = result[i].terms.length - 1; j > 0; j--) {
                //   result[i].region += result[i].terms[j].value + ' ';
                //   result[i].region = (result[i].region).replace('대한민국 ','');
                // }
              }
              $scope.search.suggestions = result;

              $ionicScrollDelegate.resize();

            }, function(status){
              // $scope.search.error = "There was an error :( " + status;
              console.error("location Suggestion : " + status);
            });

        };
        $scope.open = function() {
          return $scope.modal.show()
          // .then(function(){
          //   setTimeout(function() {
          //     $('#input-location').focus();
          //   }, 1000);
          // });
          // $('#input-location').focus();
          // $ionicPlatform.ready(function() {
          //   $('#input-location').focus();
          //   console.info('#input-location focus', $('#input-location'));
          // });
        };
        $scope.close = function() {
          return $scope.modal.hide();
        };
        $scope.choosePlace = function(place) {
          console.log(JSON.stringify(place))
          if( place.type == 'daum'){
            // $scope.location = location;
            // console.info('selected location', location);
            $scope.location.type = 'daum';
            $scope.location.name = place.name;
            $scope.location.address = place.address;
            $scope.location.geometry = { location: { lat: place.lat, lng: place.lng }};
            // $scope.location.lps = place.place_id + '.daum';
            console.log($scope.location);
            $scope.close();
          }
          else if (place.type =='google') {
            LocationService.getDetails(place.place_id)
            .then(function(location) {
              // alert(JSON.stringify(location));

              // $scope.location = location;
              // console.info('selected location', location);
              $scope.location.type = 'google';
              $scope.location.name = place.name;
              $scope.location.address = place.address;
              $scope.location.geometry = { location: { lat: location.geometry.location.lat(), lng: location.geometry.location.lng() }};
              $scope.location.lps = place.place_id + '.google';
              console.log($scope.location);
              $scope.close();
            });
          } else {
            $scope.location.type = place.type;
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
          $scope.mapEventListener = $scope.map.addListener('center_changed', function() {
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
        $scope.showMap = function(pos) {
          $ionicModal.fromTemplateUrl('js/modal.map.html', {
            scope: $scope,
            focusFirstInput: true
          }).then(function(modal) {
            $scope.modalMap = modal;
            $scope.modalMap.show()
            .then(function() {
                fitMapToScreen();
                initMap(pos);
            });
          });
        };
        $scope.openMap = function() {
          $ionicModal.fromTemplateUrl('js/modal.map.html', {
            scope: $scope,
            focusFirstInput: true
          }).then(function(modal) {
            $scope.modalMap = modal;
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
            google.maps.event.removeListener($scope.mapEventListener);
            $scope.map = null;
            $scope.modalMap.hide();
            return $scope.modalMap.remove();
          });
        };
      });
    }
  }
}]);
