'use strict';

angular.module('phopl.ctrls')
.controller('configCtrl', ['$scope', '$state', '$ionicPopup', 'PKFileStorage', 'PKLocalStorage', function($scope, $state, $ionicPopup, PKFileStorage, PKLocalStorage) {
  var config = this;
  config.version = '1.0.0';

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  config.logout = function() {
    console.info('logout');
    $ionicPopup.confirm({
			title: '로그아웃',
			template: '정말 로그아웃 하시겠습니까?'
		})
		.then(function(res){
			if (res) {
        PKFileStorage.remove('accountID');
        PKFileStorage.remove('auth_vd_token');
        PKFileStorage.remove('auth_user_token');
        $state.go('register');
      }
    });    
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
