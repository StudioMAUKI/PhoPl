'use strict';

angular.module('phopl.ctrls')
.controller('profileCtrl', ['$scope', 'RemoteAPIService', function($scope, RemoteAPIService) {
  var profile = this;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function checkProfileInfo() {
    RemoteAPIService.checkVerified()
    .then(function(accountInfo) {
      if (accountInfo) {
        if (!accountInfo.email) {
          alertAndExit('프로필 정보를 가져오던 중 심각한');
          return;
        }
        var data =JSON.parse(accountInfo.data);
        profile.nickname = accountInfo.nickname;
        profile.email = accountInfo.email;
        profile.profileImg = data.profileImg;

      } else if (accountInfo === null) {
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
}]);
