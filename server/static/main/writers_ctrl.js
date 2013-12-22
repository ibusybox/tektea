//angular.module('articalCtrlApp', ['ngSanitize']);

function WritersCtrl($scope, $http){

    $scope.getWriters = function(){
        //check if user is signed in then add a "Mine" nav bar
        //signinService.processSignin;

        $http({
            url: '/writers/json',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            $scope.html = new EJS({url: '/main/writers.ejs'}).render(data);
        } ).error( function ( data, status ){
            //do nothing
            $scope.html = '';
        } );
    };

    $scope.getWriterDetail = function(){
        $http({
            url: '/article/writer/?name=' + getURLParameter('name'),
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            $scope.writerDetail = new EJS({url: '/main/writer_detail.ejs'}).render(data);
        } ).error( function ( data, status ){
            //do nothing
            $scope.writerDetail = '';
        } );        
    };
}