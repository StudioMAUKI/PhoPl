'use strict';

angular.module('phopl.ctrls')
.controller('confirmProfileCtrl', ['$scope', '$state', '$ionicPopup', '$http', '$ionicActionSheet', 'PKFileStorage', 'RemoteAPIService', function($scope, $state, $ionicPopup, $http, $ionicActionSheet, PKFileStorage, RemoteAPIService) {
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
    .then(function(accountInfo) {
      if (accountInfo) {
        var data =JSON.parse(accountInfo.data);
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

  function fillProfileField(accountInfo) {
    if (accountInfo.email.indexOf('@facebook') !== -1) {
      //  요부분부터 내일 다시 검토해야 함
      var fbProfile = PKFileStorage.get('fb_profile');
      confirmProfile.nickname = fbProfile.name;
      confirmProfile.email = fbProfile.email;
    } else if (accountInfo.email.indexOf('@kakaotalk') !== -1) {
      var kakaoProfile = PKFileStorage.get('kakao_profile');
      // confirmProfile.nickname =
    } else {
      confirmProfile.nickname = accountInfo.nickname;
      confirmProfile.email = accountInfo.email;
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
    $ionicActionSheet.show({
      buttons: [
        { text: '카메라로 사진 찍기' },
        { text: '앨범에서 선택' }
      ],
      titleText: '프로필 사진을 지정합니다.',
      cancelText: '취소',
      buttonClicked: function(index) {
        console.log('[Event(ActionSheet:click)]Button['+ index + '] is clicked.');
        if (index == 0) {
          PhotoService.getPhotoFromCamera({width:300, height:300})
      		.then(function(imageURI) {
            confirmProfile.profileImg = imageURI;
            // RemoteAPIService.uploadImage(imageURI)
        		// .then(function(response) {
        		// 	console.log('Image UUID: ' + response.uuid);
      			// 	RemoteAPIService.sendUserPost({
      			// 		images: [{
      			// 			content: response.url
      			// 		}],
      			// 		uplace_uuid: place.uplace_uuid
      			// 	})
      			// 	.then(function(result) {
            //     // place.loadPlaceInfo();
            //     if (place.post.userPost.images === undefined || place.post.userPost.images === null || place.post.userPost.images.length === 0) {
            //       place.post.userPost.images = [result.data.userPost.images[0]];
            //       place.imagesForSlide = [result.data.userPost.images[0].content];
            //       place.coverImage = result.data.userPost.images[0].summary;
            //     } else {
            //       place.post.userPost.images.splice(0, 0, result.data.userPost.images[0]);
            //       place.imagesForSlide.splice(0, 0, result.data.userPost.images[0].content);
            //     }
      			// 	}, function(err) {
      			// 		$ionicPopup.alert({
      		  //       title: 'ERROR: Send user post',
      		  //       template: JSON.stringify(err)
      		  //     });
      			// 	});
        		// }, function(err) {
        		// 	$ionicPopup.alert({
            //     title: 'ERROR: Upload Image',
            //     template: JSON.stringify(err)
            //   });
        		// });
      		});
        } else {
          // PhotoService.getPhotosFromAlbum(5)
      		// .then(function(imageURIs) {
          //   // console.dir(imageURIs);
          //   for (var i = 0; i < imageURIs.length; i++){
          //     $ionicLoading.show({
          // 			template: '<ion-spinner icon="lines">저장 중..</ion-spinner>',
          // 			duration: 60000
          // 		});
          //     RemoteAPIService.uploadImage(imageURIs[i])
          // 		.then(function(response) {
          // 			console.log('Image UUID: ' + response.uuid);
        	// 			RemoteAPIService.sendUserPost({
        	// 				images: [{
        	// 					content: response.url
        	// 				}],
        	// 				uplace_uuid: place.uplace_uuid
        	// 			})
        	// 			.then(function(result) {
          //         // place.loadPlaceInfo();
          //         $ionicLoading.hide();
          //         if (place.post.userPost.images === undefined || place.post.userPost.images === null || place.post.userPost.images.length === 0) {
          //           place.post.userPost.images = [result.data.userPost.images[0]];
          //           place.imagesForSlide = [result.data.userPost.images[0].content];
          //           place.coverImage = result.data.userPost.images[0].summary;
          //         } else {
          //           place.post.userPost.images.splice(0, 0, result.data.userPost.images[0]);
          //           place.imagesForSlide.splice(0, 0, result.data.userPost.images[0].content);
          //         }
        	// 			}, function(err) {
          //         $ionicLoading.hide();
        	// 				$ionicPopup.alert({
        	// 	        title: 'ERROR: Send user post',
        	// 	        template: JSON.stringify(err)
        	// 	      });
        	// 			});
          // 		}, function(err) {
          //       $ionicLoading.hide();
          // 			$ionicPopup.alert({
          //         title: 'ERROR: Upload Image',
          //         template: JSON.stringify(err)
          //       });
          // 		});
          //   }
      		// });
        }

        return true;
      }
    });
  }
}]);
