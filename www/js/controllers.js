angular.module('liquium.controllers', [])

// APP
.controller('AppCtrl', function($scope, $ionicConfig) {

})

// POLLS
//brings all poll categories
.controller('PollsCategoriesCtrl', function($scope, $http) {
	$scope.poll_categories = [];

	$http.get('http://localhost:8080/api/organization/0x5b1869d9a4c187f2eaa108f3062412ecf0526b24').then(function(response) {
		$scope.poll_categories = response.data.categories;
	});
})

//bring specific category providers
.controller('CategoryPollsCtrl', function($scope, $http, $stateParams) {
	$scope.category_polls = [];

	$scope.category = $stateParams.category;
	$http.get('http://localhost:8080/api/organization/0x5b1869d9a4c187f2eaa108f3062412ecf0526b24').then(function(response) {
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
.controller('PollsListCtrl', function($scope, $http, $stateParams) {
	$scope.polls = [];

	$http.get('http://localhost:8080/api/organization/0x5b1869d9a4c187f2eaa108f3062412ecf0526b24').then(function(response) {
		var respJson = response.data;
		//console.log(respJson);
		for (var poll in respJson.polls) {
		  $scope.polls.push(respJson.polls[poll]);
		}
	});
})

//this method brings posts for a source provider
.controller('PollCtrl', function($scope, $stateParams, $http, $q, $ionicLoading, $state) {

	var pollId = $stateParams.pollId;
	$scope.choice = -1;

	$ionicLoading.show({
		template: 'Loading poll...'
	});

	$http.get('http://localhost:8080/api/organization/0x5b1869d9a4c187f2eaa108f3062412ecf0526b24').then(function(response) {

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

.controller('DelegatesCtrl', function($scope, $http, $stateParams) {
	$scope.categories_delegates = [];

	$http.get('http://localhost:8080/api/organization/0x5b1869d9a4c187f2eaa108f3062412ecf0526b24').then(function(response) {
			$scope.categories_delegates = response.data.delegates;
	});
})
;
