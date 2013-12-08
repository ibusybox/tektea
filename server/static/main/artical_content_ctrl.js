angular.module('articalContentCtrlApp', ['ngSanitize']);

function ArticalContentCtrl($scope, $http){
    $scope.artical = {title: '', articalHTML: '', articalMD: '', writer: '', creationDateTime: ''};
    $scope.getArticalContent = function(){
        var title = getURLParameter('title');
        var writer = getURLParameter('writer');
        $scope.artical.title = title;
        $http({
            url: '/artical/content/?title=' + encodeURIComponent(title) + '&writer=' + writer,
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded; charset=UTF-8'}
        }).success( function( data, status ){
            $scope.artical.articalHTML = data.articalHTML;
            $scope.artical.writer = data.writer;
            $scope.artical.creationDateTime = data.creationDateTime;
            $scope.artical.category = data.category;
        } ).error( function( data, status ){
            $scope.artical.articalHTML = '<p>server error ' + status + '</p>';
        });
    }
}