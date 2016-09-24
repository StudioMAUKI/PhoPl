'use strict';

angular.module('phopl.ctrls')
.controller('configCtrl', ['$scope', '$state', 'PKFileStorage', 'PKLocalStorage', function($scope, $state, PKFileStorage, PKLocalStorage) {
  var config = this;
  config.version = '1.0.0';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  config.logout = function() {
    console.info('logout');
    PKFileStorage.remove('accountID');
    PKFileStorage.remove('auth_vd_token');
    PKFileStorage.remove('auth_user_token');
    $state.go('register');
  }

  config.reset = function() {
    if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      PKFileStorage.reset();
    } else {
      PKLocalStorage.remove('accountID');
      PKLocalStorage.remove('hasAgreedWithLocationPolicy');
      PKLocalStorage.remove('hasConfirmedProfileInfo');
      PKLocalStorage.remove('initial_popup_viewed');
    }
    $state.go('login');
  }
}]);
