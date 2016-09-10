'use strict';

angular.module('phopl.ctrls')
.controller('confirmProfileCtrl', ['$scope', '$state', '$ionicPopup', '$http', 'PKFileStorage', 'RemoteAPIService', function($scope, $state, $ionicPopup, $http, PKFileStorage, RemoteAPIService) {
  var confirmProfile = this;
  confirmProfile.nickname = '';
  confirmProfile.email = '';
  confirmProfile.profileImg = '';
  confirmProfile.accountID = '';

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function checkProfileInfo() {
    RemoteAPIService.checkVerified()
    .then(function(result) {
      if (result) {
        var data =JSON.parse(result.data);
        confirmProfile.accountID = result.email;
        if (!confirmProfile.accountID) {
          alertAndExit('프로필 정보를 가져오던 중 심각한');
          return;
        }

        if (!result.nickname || !data.profileImg) {
          fillProfileField(confirmProfile.accountID);
        } else {
          PKFileStorage.set('nickname', result.nickname);
          PKFileStorage.set('profileImg', data.profileImg);
          console.warn('어? 정보가 다 있는데, 대체 여기로 왜 온거지?');
          $state.go('tab.config');
        }
      } else if (result === null) {
        $ionicPopup.alert({
          title: '잠시만요!',
          template: '입력하신 이메일 주소로 확인 메일이 발송되었습니다. 메일에 포함된 링크를 클릭 하신 후 계속 진행해 주세요.'
        })
        .then(function() {
          checkProfileInfo(); //  !!!
        });
      }
    }, function(err) {
      alertAndExit('서버와 통신 중');
    });
  }

  function fillProfileField(accountID) {
    if (accountID.indexOf('@facebook') !== -1) {
      //  요부분부터 내일 다시 검토해야 함
      var fbProfile = PKFileStorage.get('fb_profile');
      confirmProfile.nickname = fbProfile.name;
      confirmProfile.email = fbProfile.email;
    } else if (accountID.indexOf('@kakaotalk') !== -1) {
      var kakaoProfile = PKFileStorage.get('kakao_profile');
    } else {
      confirmProfile.nickname = '';
      confirmProfile.email = accountID;
      confirmProfile.profileImg = 'img/blank-profile.png';
    }
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
  $scope.$on('$ionicView.afterEnter', checkProfileInfo);

  //////////////////////////////////////////////////////////////////////////////
  //  public methods
  //////////////////////////////////////////////////////////////////////////////
  confirmProfile.submit = function() {
    // console.info('완료했고, 공유 화면으로 이동해야 함');
    // PKFileStorage.set('hasConfirmedProfileInfo', true);
    // $state.go('tab.config');
    RemoteAPIService.updateUserInfo({
      email: confirmProfile.email,
      nickname: confirmProfile.nickname,
      data: JSON.stringify({
        profileImg: confirmProfile.profileImg
      })
    })
    .then(function() {

    }, function(err) {
      if (err.status === 400) {
        //  닉네임이 유일하지 않은 경우임
      } else {
        //  기타 에러 처리
      }
    });
  }

  confirmProfile.changeProfileImg = function() {
    console.info('confirmProfile.changeProfileImg');
  }
}]);
