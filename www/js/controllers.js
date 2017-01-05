angular.module('liquium.controllers', ['ApiURL', 'ContractAddress'])

// APP
.controller('AppCtrl', function($scope, $ionicConfig) {

})

// POLLS
//brings all poll categories
.controller('PollsCategoriesCtrl', function($scope, $http, ApiURL, ContractAddress) {
	$scope.poll_categories = [];

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {
		$scope.poll_categories = response.data.categories;
	});
})

//bring specific category providers
.controller('CategoryPollsCtrl', function($scope, $http, $stateParams, ApiURL, ContractAddress) {
	$scope.category_polls = [];

	$scope.category = $stateParams.category;
	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {
		var category = _.find(response.data, {id: $scope.category});
		$scope.categoryTitle = category.title;
		$scope.category_polls = category.polls;
	});
})

//bring specific category providers
.controller('CategoryDelegatesCtrl', function($scope, $state, $http, $ionicLoading, $ionicPopup, $stateParams) {
	$scope.category_delegates = [];

	$scope.category = $stateParams.category;
	$http.get('views/app/example-jsons/delegates-categories.json').then(function(response) {
		var category = _.find(response.data, {id: $scope.category});
		$scope.categoryTitle = category.title;
		$scope.category_delegates = category.delegates;
	});

	$scope.showConfirm = function() {
	   var confirmPopup = $ionicPopup.confirm({
	     title: 'Confirm Decision',
	     template: 'Are you sure you want to delegate your vote to this delegate?'
	   });

	   confirmPopup.then(function(res) {
	     if(res) {
			 	$ionicLoading.show({
			 		template: 'Sending transaction...'
			 	});
				setTimeout(function(){
					$ionicLoading.hide();
					$state.go('app.delegates');
				}, 2000);
	     }
	   });
	 };
 })

//bring specific category providers
.controller('PollsListCtrl', function($scope, $http, $stateParams, ApiURL, ContractAddress) {
	$scope.polls = [];

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {
		var respJson = response.data;
		//console.log(respJson);
		for (var poll in respJson.polls) {
		  $scope.polls.push(respJson.polls[poll]);
		}
	});
})

//this method brings posts for a source provider
.controller('PollCtrl', function($scope, $stateParams, $http, $q, $ionicLoading, $state, ApiURL, ContractAddress) {

	var pollId = $stateParams.pollId;
	$scope.choice = -1;

	$ionicLoading.show({
		template: 'Loading poll...'
	});

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {

		var respJson = response.data;
		$scope.poll = respJson.polls[pollId];

		$ionicLoading.hide();
	});

	$scope.vote = function(choice) {
		$ionicLoading.show({
			template: 'Sending transaction...'
		});
		setTimeout(function(){
			$ionicLoading.hide();
			$state.go('app.polls-list');
		}, 2000);
	};
})

.controller('DelegatesCtrl', function($scope, $http, $stateParams, ApiURL, ContractAddress) {
	$scope.categories_delegates = [];

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {
			$scope.categories_delegates = response.data.delegates;
	});
})
;
