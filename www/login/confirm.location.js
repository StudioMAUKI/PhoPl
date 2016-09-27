'use strict';

angular.module('phopl.ctrls')
.controller('confirmLocationCtrl', ['$scope', '$state', '$ionicModal', 'PKFileStorage', function($scope, $state, $ionicModal, PKFileStorage) {
  var confirmLocation = this;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  confirmLocation.showPolicy = function() {
    $ionicModal.fromTemplateUrl('login/modal.location.html', {
      scope: $scope
    })
    .then(function(modal) {
      confirmLocation.modal = modal;
      confirmLocation.modal.show();
    });
  };

  confirmLocation.closeLocationPolicy = function() {
    confirmLocation.modal.hide();
    confirmLocation.modal.remove();
  }

  confirmLocation.preceedToRegister = function() {
    PKFileStorage.set('hasAgreedWithLocationPolicy', true);
    $state.go('register');
  };
}]);
