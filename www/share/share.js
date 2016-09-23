'use strict';

angular.module('phopl.ctrls')
.controller('shareCtrl', ['$scope', '$ionicModal', '$state', 'DOMHelper', 'PKLocalStorage', function($scope, $ionicModal, $state, DOMHelper, PKLocalStorage) {
  var share = this;
  share.attatchedImages = [
    'http://image.chosun.com/sitedata/image/201312/13/2013121302159_0.jpg',
    'http://cfile227.uf.daum.net/image/192ABF3350BC88EB224FF9',
    'http://pds25.egloos.com/pds/201207/23/96/e0063996_500c1d8f0a41d.jpg',
    'http://cfile28.uf.tistory.com/image/240FD148543CB20803D582',
    'http://cfile2.uf.tistory.com/image/2551564D54CC3B5128C971',
    'http://cfile22.uf.tistory.com/image/2643CC4451C8657E237976',
    'http://xguru.net/wp-content/uploads/2013/08/b0012399_10054380.jpg',
    'http://pds18.egloos.com/pds/201010/19/66/b0008466_4cbd1a5e1db64.jpg',
    'http://cfile8.uf.tistory.com/image/112CC25A4D9DA7E81EB86E',
    'http://pds27.egloos.com/pds/201305/21/76/b0119476_519b41b6ae395.jpg',
    'http://thumbnail.egloos.net/850x0/http://pds25.egloos.com/pds/201412/09/76/b0119476_5485cf925668e.jpg'
  ];
  share.note = '메모를 남기세요.';
  share.placeNameForSave = '';
  share.placeholderTitle = '어디인가요?';
  share.placeholderSubTitle = '장소 이름을 입력하세요';
  share.location = {};

  share.calculatedHeight = DOMHelper.getImageHeight('view-container', 3, 5);
  console.info('share.calculatedHeight = ' + share.calculatedHeight);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    share.attatchedImages = PKLocalStorage.get('savedImgs');
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////

  // share.promptNoteModal = function() {
  //   $ionicModal.fromTemplateUrl('share/modal.note.html', {
  //     scope: $scope,
  //     focusFirstInput: true
  //   }).then(function(modal) {
  //     share.modal = modal;
  //     share.modal.show();
  //     var iframeDocument = document.getElementById('editor').contentDocument;
  //     iframeDocument.designMode = 'on';
  //     $(iframeDocument).find('body').append(share.note);
  //   });
  // }
  //
  // share.closeModal = function() {
  //   share.note = $('#editor').contents().find('body').html();
  //   $('#note-result').html(share.note);
  //   share.modal.hide();
  //   share.modal.remove();
  // }

  share.upload = function() {
    console.info('upload images..');
    $state.go('tab.shareResult');
  };

  $scope.$watch('share.note', function(newValue) {
    $('#note-result').html(share.note);
  });

}]);
