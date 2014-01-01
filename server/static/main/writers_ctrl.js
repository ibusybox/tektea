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
            var cats = {writer: {name: data.writer.name, desc: data.writer.desc}, categories: new Object()};
            for( var i = 0; i < data.writer.articles.length; i++ ){
                if ( cats.categories.hasOwnProperty( data.writer.articles[i] ) ){
                    cats.categories[ data.writer.articles[i].category ] = cats.categories[ data.writer.articles[i].category ] + 1;
                }else{
                    cats.categories[ data.writer.articles[i].category ] = 1;
                }
            }
            $scope.writerDetail = new EJS({url: '/main/writer_detail.ejs'}).render(cats);
        } ).error( function ( data, status ){
            //do nothing
            $scope.writerDetail = '';
        } );        
    };

    $scope.getArticleByCategory = function(){
        $http({
            url: '/article/meta',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success( function ( data, status ){
            var targetCategory = getURLParameter('category');
            var dataFilterByCategory = {metaList: []};
            for ( var i = 0; i < data.metaList.length; i++ ){
                if ( data.metaList[i].category == targetCategory ){
                    dataFilterByCategory.metaList.push(data.metaList[i]);
                }
            }

            $scope.articleByCategory = new EJS( {url: '/main/article_summary.ejs'} ).render( dataFilterByCategory );

        } ).error( function ( data, status ){
            //do nothing
            $scope.articleByCategory = '';
        } );
    };

}