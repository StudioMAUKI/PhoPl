'use strict';

angular.module('phopl.ctrls')
.controller('albumsCtrl', ['$scope', '$state', '$q', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', 'DOMHelper', 'RemoteAPIService', 'PKLocalStorage', 'PKSessionStorage', function($scope, $state, $q, $ionicLoading, $ionicPopover, $ionicScrollDelegate, DOMHelper, RemoteAPIService, PKLocalStorage, PKSessionStorage) {
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
    // var curPos = PKLocalStorage.get('curPos') || { latitude: 37.5666103, longitude: 126.9783882 };
    var curPos = {};
		var lon = curPos.longitude || null;
    var lat = curPos.latitude || null;
    var radius = 0;
    var limit = 0;
    var orderingOption = {
      type: albums.orderingType,
      lng: lon,
      lat: lat
    };

		if (albums.completedFirstLoading === false) {
			$ionicLoading.show({
				template: '<ion-spinner icon="lines">로딩 중..</ion-spinner>'
			});
		}

    RemoteAPIService.getUplaces(position, albums.filteringType, orderingOption)
		.then(function(result) {
			// albums.posts = result.total;
      albums.postsSet = result;
      // albums.posts = albums.postsSet[albums.filteringType];
      albums.totalPosts = albums.postsSet['total'];
      albums.sharedPosts = albums.postsSet['shared'];
      albums.savedPosts = albums.postsSet['saved'];
			deferred.resolve();
			// console.dir(albums.posts);
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

    // RemoteAPIService.getUplaces('top', 'total');

		return deferred.promise;
	};

  //////////////////////////////////////////////////////////////////////////////
  //  Event Handler
  //////////////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.loaded', function() {
    loadSavedPlace('top');
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
		if (albums.completedFirstLoading){
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
		} else {
			if (direction === 'top') {
				$scope.$broadcast('scroll.refreshComplete');
			} else if (direction === 'bottom') {
				$scope.$broadcast('scroll.infiniteScrollComplete');
			}
		}
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
		albums.popOver.hide();
		if (albums.orderingType !== type) {
			albums.orderingType = type;
			albums.postsSet = RemoteAPIService.changeOrderingTypeOfUplaces({type: type});
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
