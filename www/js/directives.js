angular.module('phopl.directives')
.directive('expandingTextarea', [function () {
    return {
        restrict: 'A',
        controller: function ($scope, $element, $attrs, $timeout) {
            $element.css('min-height', '0');
            $element.css('resize', 'none');
            $element.css('overflow-y', 'hidden');
            setHeight(0);
            $timeout(setHeightToScrollHeight);

            function setHeight(height) {
                $element.css('height', height + 'px');
                $element.css('max-height', height + 'px');
            }

            function setHeightToScrollHeight() {
                setHeight(0);
                var scrollHeight = angular.element($element)[0]
                  .scrollHeight;
                if (scrollHeight !== undefined) {
                    setHeight(scrollHeight);
                }
            }

            $scope.$watch(function () {
                return angular.element($element)[0].value;
            }, setHeightToScrollHeight);
        }
    };
}])
.directive('locationSuggestion', ['$ionicModal', 'LocationService', function($ionicModal, LocationService){
  return {
    restrict: 'A',
    scope: {
      location: '='
    },
    link: function($scope, element){
      console.log('locationSuggestion started!');
      $scope.search = {};
      $scope.search.suggestions = [];
      $scope.search.query = "";
      $ionicModal.fromTemplateUrl('views/home/modal-location.html', {
        scope: $scope,
        focusFirstInput: true
      }).then(function(modal) {
        $scope.modal = modal;
      });
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
          $scope.modal.show();
        };
        $scope.close = function() {
          $scope.modal.hide();
        };
        $scope.choosePlace = function(place) {
          if (place.place_id !== -1) {
            LocationService.getDetails(place.place_id)
            .then(function(location) {
              $scope.location = location;
              $scope.location.type = 'google';
              $scope.location.lps = $scope.location.place_id + '.google';
              $scope.close();
            });
          } else {
            $scope.location.type = 'mauki';
            $scope.location.name = '현재 위치';
            $scope.location.lps = null;
            $scope.close();
          }
        };
      });
    }
  }
}]);
