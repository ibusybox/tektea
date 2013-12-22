//angular.module('articalCtrlApp', ['ngSanitize']);

function JoinUsCtrl($scope, $http, signinService){

    $scope.getJoinUsDesc = function(){
        //check if user is signed in then add a "Mine" nav bar
        //signinService.processSignin;

        $http({
            url: '/joinus/json',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            $scope.html = data;
        } ).error( function ( data, status ){
            //do nothing
            $scope.html = '';
        } );
    };
}