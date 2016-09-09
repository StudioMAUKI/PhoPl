'use strict';

angular.module('phopl.ctrls')
.controller('registerCtrl', ['$scope', '$state', '$ionicPlatform', '$ionicPopup', '$q', 'PKFileStorage', 'RemoteAPIService', function($scope, $state, $ionicPlatform, $ionicPopup, $q, PKFileStorage, RemoteAPIService) {
  var register = this;
  register.email = '';

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function login(accountID) {
    var deferred = $q.defer();
    PKFileStorage.set('accountID', accountID);

    // VD 등록
    RemoteAPIService.registerVD(accountID)
    .then(function(token) {
      // VD 로그인
      RemoteAPIService.loginVD(token)
      .then(function(token) {
        console.log('login success.');
        PKFileStorage.set('auth_vd_token', token);
        deferred.resolve();
      }, function(err) {
        console.error('loginVD failed.', err);
        PKFileStorage.remove('accountID');
        PKFileStorage.remove('auth_vd_token');
        deferred.reject(err);
      });
    }, function(err) {
      console.error('registerVD failed', err);
      PKFileStorage.remove('accountID');
      PKFileStorage.remove('auth_vd_token');
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function goToNextStep() {
    RemoteAPIService.checkVerified()
    .then(function(result) {
      if (result === 'OK') {
        $state.go('confirmProfile');
      } else if (result === 'EMPTY') {
        $ionicPopup.alert({
          title: '잠시만요!',
          template: '입력하신 이메일 주소로 확인 메일이 발송되었습니다. 메일에 포함된 링크를 클릭 하신 후 계속 진행해 주세요.'
        })
        .then(function() {
          goToNextStep();
        });
      } else {
        $ionicPopup.alert({
          title: '죄송합니다!',
          template: '알 수없는 오류가 발생했습니다. 앱을 완전히 종료하시고, 잠시후 다시 시작해 주세요.'
        })
        .then(function() {
          ionic.Platform.exitApp();
        });
      }
    }, function(err) {
      $ionicPopup.alert({
        title: '죄송합니다!',
        template: '서버와 통신 중 오류가 발생했습니다. 앱을 완전히 종료하시고, 잠시후 다시 시작해 주세요.'
      })
      .then(function() {
        ionic.Platform.exitApp();
      });
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    $ionicPlatform.ready(function() {
      PKFileStorage.init()
      .then(function() {
        var auth_user_token = PKFileStorage.get('auth_user_token');
        if (auth_user_token === null || auth_user_token === undefined || auth_user_token === '') {
          console.error('ERROR! auth_user_token must be exist!!');
          $state.go('login');
        }
      }, function(err) {
        console.error(err);
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  register.proceedToProfile = function() {
    console.info('프로필 확정 뷰로 이동해야 함.');
    PKFileStorage.set('accountID', 'test');
    if (PKFileStorage.get('hasConfirmedProfileInfo')) {
      $state.go('tab.config');
    } else {
      $state.go('confirmProfile');
    }
  }

  register.loginWithEmail = function() {
    var emailRegExp = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

		if (register.email === '') {
			$ionicPopup.alert({
        title: '잠시만요!',
        template: '이메일 주소를 입력해 주세요.'
      });
		} else if (!emailRegExp.test(register.email)) {
			$ionicPopup.alert({
        title: '잠시만요!',
        template: '유효한 이메일 주소를 입력해 주세요.'
      });
		}else {
			console.info('이제 vd register, login으로 진행해도 됨');
      login(register.email)
      .then(function() {
        goToNextStep();
      }, function(err) {
        $ionicPopup.alert({
          title: '죄송합니다!',
          template: '인증 처리 중 오류가 발생했습니다. 앱을 완전히 종료하고 다시 시작해 주세요.'
        })
        .then(function() {
          ionic.Platform.exitApp();
        });
      });
		}
  }
}]);
