angular.module('articalCtrlApp', ['ngSanitize']);

function ArticalCtrl($scope, $http){

    $scope.getAllArticalList = function(){
        $http({
            url: '/artical/meta',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            $scope.metaList = data.metaList;
        } ).error( function ( data, status ){
            //do nothing
            $scope.metaList = {};
        } );
    };
}