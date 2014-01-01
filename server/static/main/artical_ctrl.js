//angular.module('articalCtrlApp', ['ngSanitize']);

function ArticalCtrl($scope, $http, signinService){

    $scope.getAllArticalList = function(){
        //check if user is signed in then add a "Mine" nav bar
        //signinService.processSignin();

        $http({
            url: '/article/meta',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            $scope.articalSummaryHTML = new EJS( {url: '/main/article_summary.ejs'} ).render( data );
        } ).error( function ( data, status ){
            //do nothing
            $scope.articalSummaryHTML = '';
        } );
    };
}