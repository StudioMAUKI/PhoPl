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

  function removeImages() {
    var deferred = $q.defer();

    var imagesForRemoving = [];
    for (let image of edit.attatchedImages) {
      if (!image.added && image.removed) {
        imagesForRemoving.push({
          content: image.content
        });
      }
    }
    if (imagesForRemoving.length > 0) {
      console.log('imagesForRemoving', imagesForRemoving);
      RemoteAPIService.deleteContentInUserPost({
        uplace_uuid: edit.uplace_uuid,
        images: imagesForRemoving
      }).then(function(result) {
        console.log('Removing images successed.', result);
        return deferred.resolve();
      })
      .catch(function(err) {
        console.error('Removing images failed.', err);
        return deferred.reject(err);
      })
    } else {
      return deferred.resolve();
    }

    return deferred.promise;
  }

  function removeNotes() {
    var deferred = $q.defer();

    var notesForRemoving = [];
    for (let note of edit.updatePost.notes) {
      if (note.removed) {
        notesForRemoving.push({
          content: note.content
        });
      }
    }
    if (notesForRemoving.length > 0) {
      RemoteAPIService.deleteContentInUserPost({
        uplace_uuid: edit.uplace_uuid,
        notes: notesForRemoving
      }).then(function(result) {
        console.log('Removing notes successed.', result);
        return deferred.resolve();
      })
      .catch(function(err) {
        console.error('Removing notes failed.', err);
        return deferred.reject(err);
      })
    } else {
      return deferred.resolve();
    }

    return deferred.promise;
  }
  function updatePlace() {
    var deferred = $q.defer();

    //  지워야할 것들 부터 지운다
    //  노트 지우기
    //  이미지 지우기
    removeImages()
    .finally(function() {
      console.log('image 처리됨');
      return removeNotes();
    })
    .finally(function() {
      console.log('note 처리됨');
    });


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
      showAlert('이미지 불러오기 실패', err);
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
      showAlert('이미지 불러오기 실패', err);
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    let updatePost = PKLocalStorage.get('updatePost');
    // console.log(JSON.stringify(updatePost));
    edit.updatePost = updatePost.userPost;
    edit.uplace_uuid = updatePost.uplace_uuid;

    for (var i = 0; edit.updatePost.notes && i <  edit.updatePost.notes.length; i++) {
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
    updatePlace()
    .then(function(result) {
      //  내용 넣어야 함
    }, function(err) {
      showAlert('앨범 수정 실패', err);
    });
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
