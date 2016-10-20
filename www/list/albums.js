'use strict';

angular.module('phopl.ctrls')
.controller('albumsCtrl', ['$scope', '$state', '$stateParams', '$ionicHistory', '$q', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', 'DOMHelper', 'RemoteAPIService', 'PKLocalStorage', 'PKSessionStorage', 'MapService', function($scope, $state, $stateParams, $ionicHistory, $q, $ionicLoading, $ionicPopover, $ionicScrollDelegate, DOMHelper, RemoteAPIService, PKLocalStorage, PKSessionStorage, MapService) {
  var albums = this;
  albums.completedFirstLoading = false;
  albums.orderingType = '-modified';
  albums.filteringType = 'total';
  albums.totalScrollPosition = {left:0, top:0, zoom:1};
  albums.sharedScrollPosition = {left:0, top:0, zoom:1};
  albums.savedScrollPosition = {left:0, top:0, zoom:1};
  albums.calculatedHeight = DOMHelper.getImageHeight('view-container', 4, 5);

  //////////////////////////////////////////////////////////////////////////////
  //  Private Methods
  //////////////////////////////////////////////////////////////////////////////
  function loadSavedPlace(position) {
		console.log('loadSavedPlace : ' + position);
		var deferred = $q.defer();
		position = position || 'top';

		if (albums.completedFirstLoading === false) {
			$ionicLoading.show({
				template: '<ion-spinner icon="lines">로딩 중..</ion-spinner>'
			});
		}

    RemoteAPIService.getUplaces(position, albums.filteringType)
		.then(function(result) {
			albums.postsSet = result;
      albums.totalPosts = albums.postsSet['total'];
      albums.sharedPosts = albums.postsSet['shared'];
      albums.savedPosts = albums.postsSet['saved'];
			deferred.resolve();
		}, function(err) {
			console.error('loadSavedPlace', err);
			deferred.reject(err);
		})
		.finally(function() {
			if (albums.completedFirstLoading === false) {
				$ionicLoading.hide();
				albums.completedFirstLoading = true;
			}
		});

		return deferred.promise;
	};

  function goToAlbum() {
    if (albums.completedFirstLoading) {
      PKSessionStorage.set('goToAlbumDirectly', false);
      $state.go('tab.album');
    } else {
      setTimeout(goToAlbum, 1000);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    loadSavedPlace('top');
  });

  $scope.$on('$ionicView.afterEnter', function() {
    // console.debug('$stateParams in afterEnter', $stateParams);
    // console.debug('$ionicHistory.backView() in afterEnter', $ionicHistory.backView());
    if (PKSessionStorage.get('goToAlbumDirectly')) {
      goToAlbum();
    } else {
      var post = PKSessionStorage.get('justSharedPost');
      if (post) {
        PKSessionStorage.remove('justSharedPost');
        if (albums.totalPosts && albums.sharedPosts) {
          albums.totalPosts.splice(0, 0, post);
          albums.sharedPosts.splice(0, 0, post);
        }        
      }
    }
  });

  $scope.$on('tab.list.goToAlbumDirectly', function() {
    goToAlbum();
  });

  //////////////////////////////////////////////////////////////////////////////
  //  Public Methods
  //////////////////////////////////////////////////////////////////////////////
  albums.showAlbum = function(index) {
    PKSessionStorage.set('albumToShow', albums[albums.filteringType + 'Posts'][index]);
    $state.go('tab.album', {uplace_uuid: albums[albums.filteringType + 'Posts'][index].uplace_uuid});
  }

  albums.isEndOfList = function() {
		return RemoteAPIService.isEndOfList(albums.filteringType);
	};

  albums.doRefresh = function(direction) {
		console.log('doRefersh : ' + direction);
		// if (albums.completedFirstLoading){
			if (direction === 'top') {
				loadSavedPlace('top')
				.finally(function(){
					$scope.$broadcast('scroll.refreshComplete');
				});
			} else if (direction === 'bottom') {
				loadSavedPlace('bottom')
				.finally(function(){
					$scope.$broadcast('scroll.infiniteScrollComplete');
				});
			}
		// } else {
		// 	if (direction === 'top') {
		// 		$scope.$broadcast('scroll.refreshComplete');
		// 	} else if (direction === 'bottom') {
		// 		$scope.$broadcast('scroll.infiniteScrollComplete');
		// 	}
		// }
	};

  albums.popOverOrdering = function(event) {
		$ionicPopover.fromTemplateUrl('list/popover.ordering.html', {
			scope: $scope,
		})
		.then(function(popover){
			albums.popOver = popover;
			albums.popOver.show(event);
		});
	};

	albums.isActiveMenu = function(orderingType) {
		return albums.orderingType === orderingType;
	};

	albums.changeOrderingType = function(type) {
    function sort(orderingOption) {
      albums.orderingType = orderingOption.type;
      albums.postsSet = RemoteAPIService.changeOrderingTypeOfUplaces(orderingOption);
      albums.totalPosts = albums.postsSet['total'];
      albums.sharedPosts = albums.postsSet['shared'];
      albums.savedPosts = albums.postsSet['saved'];

      setTimeout(function() {
        albums.totalScrollPosition = {left:0, top:0, zoom:1};
        albums.sharedScrollPosition = {left:0, top:0, zoom:1};
        albums.savedScrollPosition = {left:0, top:0, zoom:1};

        $ionicScrollDelegate.scrollTo(0, 0, true);
      }, 300);
    }

		albums.popOver.hide();
		if (albums.orderingType !== type) {
      if (type === 'distance_from_origin') {
        $ionicLoading.show({
  				template: '<ion-spinner icon="lines">로딩 중..</ion-spinner>'
  			});
        MapService.getCurrentPosition()
        .then(function(pos) {
          $ionicLoading.hide();
          console.debug('pos', pos);
          sort({
            type: type,
            lat: pos.latitude,
            lon: pos.longitude
          });
        }, function(err) {
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: '죄송합니다!',
            template: '현재의 위치를 얻어오지 못했습니다. 잠시후 다시 시도해 주세요.'
          });
        });
      } else {
        sort({type: type});
      }
		}
	};

  albums.showTotalList = function() {
    albums[albums.filteringType + 'ScrollPosition'] = $ionicScrollDelegate.getScrollPosition();
    albums.filteringType = 'total';
    $ionicScrollDelegate.scrollTo(albums.totalScrollPosition.left, albums.totalScrollPosition.top, false);
  };

  albums.showSharedList = function() {
    albums[albums.filteringType + 'ScrollPosition'] = $ionicScrollDelegate.getScrollPosition();
    albums.filteringType = 'shared';
    $ionicScrollDelegate.scrollTo(albums.sharedScrollPosition.left, albums.sharedScrollPosition.top, false);
  };

  albums.showSavedList = function() {
    albums[albums.filteringType + 'ScrollPosition'] = $ionicScrollDelegate.getScrollPosition();
    albums.filteringType = 'saved';
    $ionicScrollDelegate.scrollTo(albums.savedScrollPosition.left, albums.savedScrollPosition.top, false);
  }
}]);
