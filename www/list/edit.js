'use strict';

angular.module('phopl.ctrls')
.controller('editCtrl', ['$scope', '$stateParams', 'PhotoService','$ionicActionSheet', '$ionicModal', '$state', '$ionicPopup', '$q', '$ionicLoading', 'DOMHelper', 'PKLocalStorage', 'PKSessionStorage', 'RemoteAPIService', function($scope, $stateParams, PhotoService, $ionicActionSheet, $ionicModal, $state, $ionicPopup, $q, $ionicLoading, DOMHelper, PKLocalStorage, PKSessionStorage, RemoteAPIService) {
  var edit = this;

  edit.attatchedImages = [];

  edit.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);
  console.info('edit.calculatedHeight = ' + edit.calculatedHeight);


  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function showAlert(title, msg) {
		return $ionicPopup.alert({ title: title, template: msg });
	}

  function updatePlace() {
    var deferred = $q.defer();

    //  지워야할 것들 부터 지운다
    //  노트 지우기
    //  이미지 지우기
    var taskOfRemovingImages = [];
    for (let image of edit.attatchedImages) {
      if (!image.added && image.removed) {
        taskOfRemovingImages.push(RemoteAPIService.deleteContentInUserPost({
          uplace_uuid: edit.uplace_uuid,
          images:[{
            content: image.content
          }]
        }))
      }
    }

    //  추가할 것들 추가하고, 내용이 바뀐 노트도 추가
    //  노트 추가
    //  이미지 추가

    return deferred.promise;
	}

  function getPhotoFromCamera() {
		PhotoService.getPhotoFromCamera()
		.then(function(imageURI) {
      edit.attatchedImages.push({
        content: imageURI,
        removed: false,
        added: true
      });
		}, function(err) {
      console.error(err);
		});
  }

  function getPhotosFromAlbum() {
    PhotoService.getPhotosFromAlbum(100)
    .then(function(imageURIs) {
      if (imageURIs.length > 0) {
        for(var i=0; i<imageURIs.length;i++){
          edit.attatchedImages.push({
            content: imageURIs[i],
            removed: false,
            added: true
          });
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
    let updatePost = PKLocalStorage.get('updatePost');
    console.log(JSON.stringify(updatePost));
    edit.updatePost = updatePost.userPost;
    edit.uplace_uuid = updatePost.uplace_uuid;

    for (var i = 0; i < edit.updatePost.notes.length; i++) {
      edit.updatePost.notes[i].removed = false;
    }

    edit.attatchedImages = [];
    for(let img of updatePost.userPost.images ){
      edit.attatchedImages.push({
        content: img.content,
        removed: false,
        added: false
      });
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////

  edit.upload = function() {
    if (edit.attatchedImages.length === 0) {
      $ionicPopup.alert({
        title: '잠시만요!',
        template: '먼저, 저장할 사진들을 골라 주세요.'
      })
      .then(function() {
        $state.go('tab.choose');
      });
    } else {
      updatePlace()
      .then(function(result) {
        //  내용 넣어야 함
      }, function(err) {
        showAlert('앨범 수정 실패', err);
      });
    }
    // console.info('upload images..');
    // $state.go('tab.shareResult');
  };

  edit.removeImage = function(id){
    var count = 0;
    for (var i = 0; i < edit.attatchedImages.length; i++) {
      if (!edit.attatchedImages[i].removed) {
        count++;
      }
      if (count === id + 1) {
        edit.attatchedImages[i].removed = true;
        break;
      }
    }
  }

  edit.addImage = function(){
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

  edit.removeNote = function(id) {
    var count = 0;
    for (var i = 0; i < edit.updatePost.notes.length; i++) {
      if (!edit.updatePost.notes[i].removed) {
        count++;
      }
      if (count === id + 1) {
        edit.updatePost.notes[i].removed = true;
        break;
      }
    }
  }
}]);
