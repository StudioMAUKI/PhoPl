'use strict';

angular.module('phopl.ctrls')
.controller('registerCtrl', ['$scope', '$state', '$ionicPlatform', '$ionicPopup', '$q', '$cordovaOauth', '$http', 'PKFileStorage', 'RemoteAPIService', 'oauthKakao', 'loginStatus', function($scope, $state, $ionicPlatform, $ionicPopup, $q, $cordovaOauth, $http, PKFileStorage, RemoteAPIService, oauthKakao, loginStatus) {
  var register = this;
  register.email = '';

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function login(accountID) {
    var deferred = $q.defer();
    PKFileStorage.set('accountID', accountID);

    loginStatus.setLoginStatus(false);
    RemoteAPIService.registerUser(true)
    .then(function(token) {
      // 유저 로그인
      RemoteAPIService.loginUser(token)
      .then(function() {
        // VD 등록
        RemoteAPIService.registerVD(accountID, true)
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
      }, function(err) {
        console.error('loginUser failed', err);
				PKFileStorage.remove('auth_user_token');
        deferred.reject(err);
      });
    }, function(err) {
      console.error('registerUser failed', err);
      PKFileStorage.remove('auth_user_token');
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function goToNextStep() {
    RemoteAPIService.checkVerified()
    .then(function(result) {
      if (result) {
        var data =result.data;
        if (!result.nickname || !data.profileImg) {
          $state.go('confirmProfile');
        } else {
          PKFileStorage.set('nickname', result.nickname);
          PKFileStorage.set('profileImg', data.profileImg);
          PKFileStorage.set('email', result.email);
          $state.go('tab.choose');
        }
      } else if (result === null) {
        $ionicPopup.alert({
          title: '잠시만요!',
          template: '입력하신 이메일 주소로 확인 메일이 발송되었습니다. 메일에 포함된 링크를 클릭 하신 후 계속 진행해 주세요.'
        })
        .then(function() {
          goToNextStep(); //  !!!
        });
      }
    }, function(err) {
      alertAndExit('서버와 통신 중');
    });
  }

  function alertAndExit(msg) {
    $ionicPopup.alert({
      title: '죄송합니다!',
      template: msg + ' 오류가 발생했습니다. 앱을 완전히 종료하시고, 다시 시작해 주세요.'
    })
    .then(function() {
      ionic.Platform.exitApp();
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  event handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    register.email = '';

    $ionicPlatform.ready(function() {
      PKFileStorage.init()
      .then(function() {
        var auth_user_token = PKFileStorage.get('auth_user_token');
        if (auth_user_token === null || auth_user_token === undefined || auth_user_token === '') {
          console.warn('Warning! auth_user_token does not exist.');
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
      $state.go('tab.choose');
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
        alertAndExit();
      });
		}
  }

  register.loginWithFacebook = function() {
    var appID = '1036395799812464';
    $cordovaOauth.facebook(appID, ['public_profile', 'email'])
    .then(function(result) {
      console.log('FB result', result);
      $http.get(
        'https://graph.facebook.com/v2.7/me',
        {
          params: {
            access_token: result.access_token,
            fields: 'id, name, first_name, last_name, age_range, link, gender, locale, picture, timezone, updated_time, verified, email',
            format: 'json'
          }
        }
      )
      .then(function (result) {
        console.log('FB me result', result);
        PKFileStorage.set('fb_profile', result.data);
        var accountID = result.data.id + '@facebook.auth';
        login(accountID)
        .then(function() {
          goToNextStep();
        }, function(err) {
          alertAndExit();
        });
      }, function(err) {
        console.error('register.loginWithFacebook: FB me error', err);
      });
    }, function(err) {
      console.error('register.loginWithFacebook: FB oAuth error', err);
    });
  }

  register.loginWithKakao = function() {
    oauthKakao.signin('cb7479018234a9feda2d82f6bbdd1682')
    .then(function(result) {
      console.log('loginKakao result', result);
      $http.get('https://kapi.kakao.com/v1/user/me',
      {
        headers: {
          Authorization: result.token_type + ' ' + result.access_token
        }
      })
      .then(function(result) {
        console.log('Kakao me result', result);
        PKFileStorage.set('kakao_profile', result.data);
        var accountID = result.data.id + '@kakaotalk.auth';
        login(accountID)
        .then(function() {
          goToNextStep();
        }, function(err) {
          alertAndExit();
        });
      }, function(err) {
        console.error('register.loginWithKakao: Kakao me error', err);
      });
    }, function(err) {
      console.error('register.loginWithKakao: loginKakao error', err);
    });
  }
}]);
