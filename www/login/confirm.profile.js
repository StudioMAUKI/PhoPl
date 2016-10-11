'use strict';

angular.module('phopl.ctrls')
.controller('confirmProfileCtrl', ['$scope', '$state', '$ionicPopup', '$http', '$ionicActionSheet', 'PKFileStorage', 'RemoteAPIService', 'PhotoService', function($scope, $state, $ionicPopup, $http, $ionicActionSheet, PKFileStorage, RemoteAPIService, PhotoService) {
  var confirmProfile = this;
  confirmProfile.nickname = '';
  confirmProfile.email = '';
  confirmProfile.profileImg = '';
  confirmProfile.accountID = '';
  confirmProfile.isKakaoAccount = false;
  confirmProfile.needToUploadImg = false;

  //////////////////////////////////////////////////////////////////////////////
  //  private methods
  //////////////////////////////////////////////////////////////////////////////
  function checkProfileInfo() {
    RemoteAPIService.checkVerified()
    .then(function(accountInfo) {
      if (accountInfo) {
        var data =accountInfo.data;
        confirmProfile.accountID = accountInfo.email;
        if (!confirmProfile.accountID) {
          alertAndExit('프로필 정보를 가져오던 중 심각한');
          return;
        }

        if (!accountInfo.nickname || !data.profileImg) {
          fillProfileField(accountInfo);
        } else {
          PKFileStorage.set('nickname', accountInfo.nickname);
          PKFileStorage.set('profileImg', data.profileImg);
          console.warn('어? 정보가 다 있는데, 대체 여기로 왜 온거지?');
          //$state.go('tab.config');
          console.warn('디버깅 중이라 원래는 tab.config로 보내야 하지만, 지금은 처리하지 않음');
          fillProfileField(accountInfo);
        }
      } else if (accountInfo === null) {
        $ionicPopup.confirm({
          title: '잠시만요!',
          template: '입력하신 이메일 주소로 확인 메일이 발송되었습니다. 메일에 포함된 링크를 클릭 하신 후 계속 진행해 주세요.'
        })
        .then(function(res) {
          if (res) {
            checkProfileInfo(); //  !!!
          } else {
            $state.go('register');
          }
        });
      }
    }, function(err) {
      alertAndExit('서버와 통신 중');
    });
  }

  function fillProfileField(accountInfo) {
    confirmProfile.email = accountInfo.email;
    if (accountInfo.email.indexOf('@facebook.auth') !== -1) {
      //  요부분부터 내일 다시 검토해야 함
      var fbProfile = PKFileStorage.get('fb_profile');
      confirmProfile.nickname = fbProfile.name;
      confirmProfile.profileImg = fbProfile.picture.data.url;
      confirmProfile.realEmail = fbProfile.email;
    } else if (accountInfo.email.indexOf('@kakaotalk.auth') !== -1) {
      var kakaoProfile = PKFileStorage.get('kakao_profile');
      confirmProfile.nickname = kakaoProfile.properties.nickname;
      confirmProfile.profileImg = kakaoProfile.properties.thumbnail_image;
      confirmProfile.isKakaoAccount = true;
      confirmProfile.realEmail = null;
      confirmProfile.kakaoID = kakaoProfile.id;
    } else {
      confirmProfile.nickname = accountInfo.nickname;
      confirmProfile.realEmail = accountInfo.email;
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

  function updateUserInfo() {
    RemoteAPIService.updateUserInfo({
      email: confirmProfile.email,
      nickname: confirmProfile.nickname,
      data: JSON.stringify({
        profileImg: confirmProfile.profileImg,
        email: confirmProfile.realEmail
      })
    })
    .then(function() {
      PKFileStorage.init()
      .then(function() {
        PKFileStorage.set('accountID', confirmProfile.email);
        PKFileStorage.set('nickname', confirmProfile.nickname);
        PKFileStorage.set('profileImg', confirmProfile.profileImg);
        PKFileStorage.set('email', confirmProfile.realEmail);
        $state.go('tab.choose');
      });
    }, function(err) {
      if (err.status === 400) {
        // if (err.data.email !== null) {
        //
        // } else if (err.data.nickname !== null) {
        //
        // }
        $ionicPopup.alert({
          title: '죄송합니다!',
          template: '지정한 닉네임은 이미 사용되고 있습니다. 다른 닉네임을 지정해 주세요.'
        });
      } else {
        $ionicPopup.alert({
          title: '죄송합니다!',
          template: '프로필 정보 등록 중 오류가 발생했습니다. 잠시후 다시 시작해 주세요.'
        });
      }
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
    if (confirmProfile.nickname.length > 10) {
      $ionicPopup.alert({
        title: '죄송합니다',
        template: '닉네임은 10자 이내로 정해 주세요.'
      });
      return;
    }
    var blank_pattern = /[\s]/g;
    var special_pattern = /[`~!@#$%^&*|\\\'\";:\/?]/gi;
    if (blank_pattern.test(confirmProfile.nickname) || special_pattern.test(confirmProfile.nickname)){
      $ionicPopup.alert({
        title: '죄송합니다',
        template: '닉네임에 공백이나 특수문자는 사용할 수 없습니다.'
      });
      return;
    }

    if (confirmProfile.needToUploadImg) {
      RemoteAPIService.uploadImage(confirmProfile.profileImg)
      .then(function(response) {
      	console.log('uploadImage', response);
        confirmProfile.profileImg = response.url;
        updateUserInfo();
      }, function(err) {
      	$ionicPopup.alert({
          title: 'ERROR: Upload Image',
          template: JSON.stringify(err)
        });
      });
    } else {
      updateUserInfo();
    }

  }

  confirmProfile.changeProfileImg = function() {
    console.info('confirmProfile.changeProfileImg');
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
            confirmProfile.profileImg = imageURI;
            confirmProfile.needToUploadImg = true;
      		});
        } else {
          PhotoService.getPhotosFromAlbum(1)
      		.then(function(imageURIs) {
            if (imageURIs.length == 0) {
              return;
            }
            confirmProfile.profileImg = imageURIs[0];
            confirmProfile.needToUploadImg = true;
      		});
        }

        return true;
      }
    });
  }
}]);
