'use strict';

angular.module('phopl.ctrls')
.controller('shareCtrl', ['$scope', '$stateParams', 'PhotoService','$ionicActionSheet', '$ionicModal', '$state', '$ionicPopup', '$q', '$ionicLoading', 'DOMHelper', 'PKLocalStorage', 'PKSessionStorage', 'RemoteAPIService', function($scope, $stateParams, PhotoService, $ionicActionSheet, $ionicModal, $state, $ionicPopup, $q, $ionicLoading, DOMHelper, PKLocalStorage, PKSessionStorage, RemoteAPIService) {
  var share = this;

  share.attatchedImages = [];

  share.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);
  console.info('share.calculatedHeight = ' + share.calculatedHeight);


  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function showAlert(title, msg) {
		return $ionicPopup.alert({ title: title, template: msg });
	}

  function postPlace() {
    var deferred = $q.defer();
    var pos = null;
    var addrs = [null, null, null];


    if (!share.location.geometry) {
      pos = null;
    } else {
      console.debug('location', share.location);
      pos = {
        lon : Number(share.location.geometry.location.lng),
        lat : Number(share.location.geometry.location.lat)
      };


      if (share.location.type === 'mauki') {
        console.warn('커스텀 장소 정보로 넘어 왔기 때문에 채워 넣어야 함.');
        addrs[0] = PKLocalStorage.get('addr1');
        addrs[1] = PKLocalStorage.get('addr2');
        addrs[2] = PKLocalStorage.get('addr3');
      } else if (share.location.type === 'google'){
        addrs[0] = share.location.address;
      } else if (share.location.type === 'daum'){
        addrs[0] = share.location.address;
      } else {
        console.warn('Not supported.');
        deferred.reject('Not supported.');
        return deferred.promise;
      }
    }

    if (share.attatchedImages.length > 0) {
      $ionicLoading.show({
  			template: '<ion-spinner icon="lines">저장 중..</ion-spinner>',
  			duration: 30000
  		});

      var tasksOfUploadingImages = [];
      for (var i = 0; i < share.attatchedImages.length; i++) {
        tasksOfUploadingImages.push(RemoteAPIService.uploadImage(share.attatchedImages[i]));
      }
      $q.all(tasksOfUploadingImages)
      .then(function(results) {
        var uploadedImages = [];
        for (var i = 0; i < results.length; i++) {
          uploadedImages.push({content: results[i].url});
        }


        let sendData  = {
          uplace_uuid: share.uplace_uuid, //update
          lonLat: pos,
  				notes: [{
  					content: (share.note === '메모를 남기세요.') ? null : share.note
  				}],
  				images: uploadedImages,
  				addr1: { content: addrs[0] || null },
  				addr2: { content: addrs[1] || null },
  				addr3: { content: addrs[2] || null },
          //lps: { content: "ChIJMaghPm-7fDURSzzOy8ijYk8.google" },
          lps: (share.location !== {} && share.location.lps !== null) ? [{ content: share.location.lps }] : null,
          name: { content: (share.location !== {} && share.location.name !== null) ? share.location.name : null }
  			};

        console.log("=======");
        console.log(JSON.stringify(sendData));
        console.log("=======");

        RemoteAPIService.sendUserPost( sendData )
  			.then(function(result) {
          $ionicLoading.hide();
          deferred.resolve(result);
  			}, function(err) {
          console.error('장소 저장 실패', err);
  				$ionicLoading.hide();
          deferred.reject(err);
  			});
      }, function(err) {
        console.error('이미지 업로드 실패', err);
        $ionicLoading.hide();
        deferred.reject(err);
      });
    } else {
      deferred.reject('저장할 이미지가 없습니다.');
    }

    return deferred.promise;
	}

   function getPhotoFromCamera() {
		PhotoService.getPhotoFromCamera()
		.then(function(imageURI) {
      // PKLocalStorage.set('savedImgs', [imageURI]);
      // $state.go('tab.share');
      share.attatchedImages.push( imageURI );
		}, function(err) {
      console.error(err);
		});
  }

  function getPhotosFromAlbum() {
    PhotoService.getPhotosFromAlbum(100)
    .then(function(imageURIs) {
      if (imageURIs.length > 0) {
        // PKLocalStorage.set('savedImgs', imageURIs);
        // $state.go('tab.share');
        for(var i=0; i<imageURIs.length;i++){
          share.attatchedImages.push( imageURIs[i] );
        }
      }
    }, function(err) {
      console.error(err);
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    if ($stateParams.mode == 'update') {
      // share.mode = 'update';
      share.isUpdateMode = true;
    } else {
      // share.mode = 'create';
      share.isUpdateMode = false;
    }
    console.log('share.isUpdateMode : ' + share.isUpdateMode);

    if (share.isUpdateMode) {
      //DB값 세팅
      let updatePost = PKLocalStorage.get('updatePost');
      console.log(JSON.stringify(updatePost));

      share.uplace_uuid = updatePost.uplace_uuid;
      share.type = 'mauki';

      if(updatePost.userPost.notes)
        share.note = updatePost.userPost.notes.content;
      if(updatePost.userPost.lonLat)
        share.location = { geometry: {location : { lat: updatePost.userPost.lonLat.lat, lng:  updatePost.userPost.lonLat.lon}}};
      if(updatePost.userPost.name)
        share.location['name'] = updatePost.userPost.name.content;
      if(updatePost.userPost.addr1)
        share.location['address'] = updatePost.userPost.addr1.content;
      if(updatePost.userPost.lps)
        share.location['lps'] = updatePost.userPost.lps.content;

      let dbImages = [];
      for(let img of updatePost.userPost.images ){
        dbImages.push(img.content);
      }
      share.attatchedImages = dbImages;
      share.updatePost = PKLocalStorage.get('updatePost').userPost;
      console.log('notes: ', share.updatePost.notes);
    }else{
      //기본값 세팅
      share.uplace_uuid = null;
      share.note = '메모를 남기세요.';
      share.placeNameForSave = '';
      share.placeholderTitle = '어디인가요?';
      share.placeholderSubTitle = '장소 이름을 입력하세요';
      share.location = {};
      share.attatchedImages = PKLocalStorage.get('savedImgs');
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////

  share.upload = function() {
    if (share.attatchedImages.length === 0) {
      $ionicPopup.alert({
        title: '잠시만요!',
        template: '먼저, 저장할 사진들을 골라 주세요.'
      })
      .then(function() {
        $state.go('tab.choose');
      });
    } else {
      postPlace()
      .then(function(result) {
        PKSessionStorage.set('lastSavedPost', result);
        PKSessionStorage.set('justSharedPost', result);
        $state.go('tab.shareResult');
      }, function(err) {
        showAlert('앨범 저장 실패', err);
      });
    }
    // console.info('upload images..');
    // $state.go('tab.shareResult');
  };

  share.removeImage = function(idx){
    share.attatchedImages.splice(idx,1);
  }

  share.addImage = function(){
    //이미지, 라이브러리 선택
    // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '앨범에서 선택하기' },
       { text: '지금 사진찍기' }
     ],
    //  titleText: 'Modify your album',
     cancelText: '취소',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      if(index==0){
        getPhotosFromAlbum();
       }else if(index==1){
         getPhotoFromCamera();
       }
       return true;
     }
   });

  }


  $scope.$watch('share.note', function(newValue) {
    $('#note-result').html(share.note);
  });

}]);
