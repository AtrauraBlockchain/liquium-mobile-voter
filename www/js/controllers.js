angular.module('liquium.controllers', ['ApiURL', 'ContractAddress'])

// APP
.controller('AppCtrl', function($scope, $ionicConfig) {

})

.controller('ProfileCtrl', function($scope, $http, ApiURL, ContractAddress, $cordovaClipboard, $cordovaToast) {
	$scope.qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + liquiumMobileLib.account;
	$scope.myAddress = liquiumMobileLib.account;

	$scope.copyAddressToClipboard = function() {
		$cordovaClipboard
    .copy(liquiumMobileLib.account)
    .then(function () {
      // success
			$cordovaToast
	    .show('Address copied to clipboard', 'long', 'center')
	    .then(function(success) {
	      // success
	    }, function (error) {
	      // error
	    });
    }, function () {
      // error
    });
	};
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

.controller('CategoryDelegatesCtrl', function($scope, $state, $http, $ionicLoading, $ionicPopup, $stateParams, ApiURL, ContractAddress) {
	$scope.category_delegates = [];

	$scope.category = $stateParams.category;
	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address + "?voter=" + liquiumMobileLib.account).then(function(response) {
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

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address + "?voter=" + liquiumMobileLib.account).then(function(response) {
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
	var respJson;
	$scope.choice = -1;

	$ionicLoading.show({
		template: 'Loading poll...'
	});

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address + "?voter=" + liquiumMobileLib.account).then(function(response) {

		respJson = response.data;
		$scope.poll = respJson.polls[pollId];

		$scope.hasVoted = false;
		totalVoted = 0;
		for (var ballotId in respJson.polls[pollId].vote.ballots) {
			totalVoted += respJson.polls[pollId].vote.ballots[ballotId].amount;
			if (respJson.polls[pollId].vote.ballots[ballotId].amount == 100)
				$scope.votedOption = respJson.polls[pollId].options[ballotId].answer;
		}
		if (totalVoted == 100)
			$scope.hasVoted = true;


		$ionicLoading.hide();
	});

	$scope.vote = function(choice) {
		$ionicLoading.show({
			template: 'Sending transaction...'
		});
		liquiumMobileLib.vote(ContractAddress.address, pollId, [choice], [web3.toWei(1)], function (err, txHash){
			if(err){
				$ionicLoading.hide();
 				// An alert dialog
 				$ionicPopup.alert({
     					title: 'Error',
     					template: 'There was an error processing the transaction'
   			});
			} else {
				$ionicLoading.hide();
				$ionicPopup.alert({
     					title: 'Voted successfully',
     					template: 'Transaction Hash: ' + txHash
   			});
			}
		});
	};
})

.controller('DelegatesCtrl', function($scope, $http, $stateParams, ApiURL, ContractAddress, $ionicPopup, $ionicLoading, $cordovaClipboard, $cordovaToast) {
	$scope.category_delegates = [];
	$scope.all_delegates = [];
	$scope.new_delegates = [];

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address + "?voter=" + liquiumMobileLib.account).then(function(response) {
		$scope.all_delegates.push(
			delegate =  {
				"idDelegate": 0,
				"name": "Nobody",
				"owner": "0",
				"deleted": false
			});
		for (var delegate in response.data.delegates) {
			$scope.all_delegates.push(response.data.delegates[delegate]);
		}
		for (var category in response.data.categories) {
			var deleg;
			if (typeof response.data.categories[category].delegationList[0] !== 'undefined')
				deleg = response.data.delegates[response.data.categories[category].delegationList[0]];
			else {
				deleg =  {
		      "idDelegate": 0,
		      "name": "Nobody",
		      "owner": "0",
		      "deleted": false
		    };
			}
			$scope.category_delegates.push({
				id: response.data.categories[category].idCategory,
				name: response.data.categories[category].name,
				delegate: deleg
			});
		}
	});

	$scope.changeDel = function(del, cat) {
		$scope.new_delegates[cat.id] = del;
	};

	$scope.delegateVote = function() {
		var categoryIds = [];
		var delegates = [];
		for (var del in $scope.new_delegates) {
			if ($scope.new_delegates[del]) {
				categoryIds.push(del);
				delegates.push($scope.new_delegates[del]);
			}
		}
		$ionicLoading.show({
			template: 'Sending transaction...'
		});
		liquiumMobileLib.setDelegates(ContractAddress.address, categoryIds, delegates, function (err, txHash){
			if(err){
				$ionicLoading.hide();
 				// An alert dialog
 				$ionicPopup.alert({
     					title: 'Error',
     					template: 'There was an error processing the transaction'
   			});
				//error handling
			} else {
				$ionicLoading.hide();
				$ionicPopup.show({
   					title: 'Delegates changed successfully',
   					template: 'Transaction Hash: ' + txHash,
						buttons: [
			      { text: 'Ok',
							type: 'button-positive',
							onTap: function(e) {
							}
						},
			      {
			        text: 'Copy txHash',
							type: 'button-positive',
							onTap: function(e) {
								$cordovaClipboard
						    .copy(txHash)
						    .then(function () {
						      // success
									$cordovaToast
							    .show('Transaction Hash copied to clipboard', 'long', 'center')
							    .then(function(success) {
							      // success
							    }, function (error) {
							      // error
							    });
						    }, function () {
						      // error
						    });
							}
			      }]}
					);
				}
			});
	};

})

.controller('DelegatePanelCtrl', function($scope, $http, $stateParams, ApiURL, ContractAddress) {
	$scope.isDelegate = false;

	$http.get(ApiURL.url + '/api/organization/' + ContractAddress.address).then(function(response) {
		for (var i = 0; i < response.data.delegates.length; ++i) {
			var delegate = response.data.delegates[i];
			if (delegate.owner == liquiumMobileLib.account)
				$scope.idDelegate = delegate.idDelegate;
				$scope.delegateName = delegate.name;
				$scope.isDelegate = true;
				break;
		}
	});

	$scope.registerAsDelegate = function(delegateName) {
		console.log(delegateName);
		if (delegateName) {
			console.log(delegateName);
		}
  };
})
;
