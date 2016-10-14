'use strict';

angular.module('phopl.ctrls')
.controller('chooseCtrl', ['$scope', '$state', 'PhotoService', 'PKLocalStorage', 'loginStatus', function($scope, $state, PhotoService, PKLocalStorage, loginStatus) {
  var choose = this;

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function init() {
    PKLocalStorage.set('savedImgs', []);
    loginStatus.setLoginStatus(true);
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
      if (imageURIs.length > 0) {
        PKLocalStorage.set('savedImgs', imageURIs);
        $state.go('tab.share');
      }
    }, function(err) {
      console.error(err);
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    $('#slide-view').vegas({
      slides: [
        { src: 'img/background/1-2.jpg' },
        { src: 'img/background/2-2.jpg' },
        { src: 'img/background/3-2.jpg' },
        { src: 'img/background/4-2.jpg' }
      ],
      timer: false,
      autoplay: false,
      delay: 10000,
      overlay: 'lib/vegas/dist/overlays/02.png',
      transitionDuration: 5000
      // loop: false
    });

    console.debug('height of view : ' + $('ion-view').height());
	});
  $scope.$on('$ionicView.afterEnter', function() {
    init();
    $('#slide-view').vegas("play");
	});
  $scope.$on('$ionicView.beforeLeave', function() {
    $('#slide-view').vegas("pause");
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

  choose.getHeightOfView = function() {
    return $('ion-view').height();
  }
}]);
