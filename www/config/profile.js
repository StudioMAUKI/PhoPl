'use strict';

angular.module('phopl.ctrls')
.controller('profileCtrl', ['$scope', '$ionicActionSheet', '$ionicPopup', 'RemoteAPIService', 'PhotoService', 'PKFileStorage', function($scope, $ionicActionSheet, $ionicPopup, RemoteAPIService, PhotoService, PKFileStorage) {
  var profile = this;
  profile.needToSubmit = false;

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
        profile.data =JSON.parse(accountInfo.data);
        profile.nickname = accountInfo.nickname;
        profile.email = profile.data.email || accountInfo.email;
        profile.profileImg = profile.data.profileImg;

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

  profile.changeProfileImg = function() {
    if (!ionic.Platform.isIOS() && !ionic.Platform.isAndroid()) {
      profile.needToSubmit = true;
      return;
    }

    $ionicActionSheet.show({
      buttons: [
        { text: '카메라로 사진 찍기' },
        { text: '앨범에서 선택' }
      ],
      titleText: '프로필 사진을 수정합니다.',
      cancelText: '취소',
      buttonClicked: function(index) {
        console.log('[Event(ActionSheet:click)]Button['+ index + '] is clicked.');
        if (index == 0) {
          PhotoService.getPhotoFromCamera({width:300, height:300})
      		.then(function(imageURI) {
            profile.profileImg = imageURI;
            profile.needToSubmit = true;
      		});
        } else {
          PhotoService.getPhotosFromAlbum(1)
      		.then(function(imageURIs) {
            if (imageURIs.length == 0) {
              return;
            }
            profile.profileImg = imageURIs[0];
            profile.needToSubmit = true;
      		});
        }

        return true;
      }
    });
  };

  profile.submit = function() {
    RemoteAPIService.uploadImage(profile.profileImg)
    .then(function(response) {
    	console.log('uploadImage', response);
      profile.data.profileImg = response.url;

      RemoteAPIService.updateUserInfo({
        data: JSON.stringify(profile.data)
      })
      .then(function() {
        profile.needToSubmit = false;
        PKFileStorage.set('profileImg', profile.data.profileImg);
        $ionicPopup.alert({
          title: '성공!',
          template: '프로필 사진이 수정되었습니다.'
        });
      }, function(err) {
        $ionicPopup.alert({
          title: '죄송합니다!',
          template: '프로필 정보 등록 중 오류가 발생했습니다. 잠시후 다시 시작해 주세요.'
        });
      });

    }, function(err) {
    	$ionicPopup.alert({
        title: 'ERROR: Upload Image',
        template: JSON.stringify(err)
      });
    });
  };
}]);
