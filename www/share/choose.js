'use strict';

angular.module('phopl.ctrls')
.controller('chooseCtrl', ['$scope', '$state', 'PhotoService', 'PKLocalStorage', function($scope, $state, PhotoService, PKLocalStorage) {
  var choose = this;

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function init() {
    PKLocalStorage.set('savedImgs', []);
  }

  function getPhotoFromCamera() {
		PhotoService.getPhotoFromCamera()
		.then(function(imageURI) {
      PKLocalStorage.set('savedImgs', [imageURI]);
      $state.go('tab.share');
		}, function(err) {
      console.error(err);
		});
  }

  function getPhotosFromAlbum() {
    PhotoService.getPhotosFromAlbum(100)
    .then(function(imageURIs) {
      PKLocalStorage.set('savedImgs', imageURIs);
      $state.go('tab.share');
    }, function(err) {
      console.error(err);
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    init();
	});

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  choose.getPhotoFromCamera = function() {
    getPhotoFromCamera();
  };

  choose.getPhotosFromAlbum = function() {
    getPhotosFromAlbum();
  };
}]);
