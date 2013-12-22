var utils = require('../utils');
var fs = require('fs');
var queryString = require('querystring');
var url = require('url');

var pagedown = require("pagedown");
var converter = new pagedown.Converter();

var authMgmg = require('../usermgmt/auth');
var userMgr = require('../usermgmt/usermgr');

/**
* Global variable store the all articals meta data.
*/
var allArticalMetaData = {metaList: []};
var ARTICAL_PATH = process.cwd() + '/server/data/articles';

var ARTICAL_STATISTICS_PATH = process.cwd() + '/server/data/statistics/artical_stat.json'


/**
* get all artical meta data.
* return data format:
* {metaList: [title: 'myartical', creationDateTime: '2013-7-14 14:34:21', absolutePath: '/tmp/myartical.md']}
* input param format: none
*/
function getAllArticalMetaData(request, response){
            //empty the cache
            allArticalMetaData.metaList = [];

            utils.walkDirectory( 
                ARTICAL_PATH, 
                {followLinks : false}, 
                function( root, fileStats ){
                    walkArticalDirectory(root, fileStats);
                    return true;
                },
                function(){
                    //write response back
                    response.writeHead(200, {'Content-Type' : 'text/json'});
                    response.write(JSON.stringify(allArticalMetaData));
                    response.end();
                }
            );            
}

function walkArticalDirectory(root, fileStats ){
            if ( utils.stringEndWith(fileStats.name, ".md") ){
                //tmp variable
                var meta = {};

                //delte the .md from file name
                meta.title = fileStats.name.slice(0, -3);
                meta.absolutePath = root + '/' + fileStats.name;
                var tmpary = meta.absolutePath.split("/");
                //about the data directory: the first path is the writer name, and inside writer path is the category
                //e.g: data/artical/ibusybox/Java/myJava.md
                meta.category = tmpary[tmpary.length - 2];
                meta.writer = tmpary[tmpary.length - 3];
                meta.creationDateTime = fs.statSync(meta.absolutePath).mtime.toLocaleDateString('zh-CN');
                //get the summary, before tag '<!--more-->' is treated as summary
                var tmpcontent = fs.readFileSync(meta.absolutePath, 'utf8');
                var tmpindex = tmpcontent.indexOf("<!--more-->");
                if ( tmpindex != -1 ){
                    tmpcontent = tmpcontent.substring(0, tmpindex );
                }
                
                //adjust the image path
                tmpcontent = adjustImagePathSync(tmpcontent, meta.writer, meta.category);
                meta.summary = converter.makeHtml(tmpcontent);
                var stat = readStatisticsSync(meta.title);
                meta.viewCount = stat == null ? 0:stat.viewCount;

                allArticalMetaData.metaList.push(meta);

            }

}

function walkArticalDirectorySync(finish){
            utils.walkDirectory( 
                ARTICAL_PATH, 
                {followLinks : false}, 
                function( root, fileStats ){
                    walkArticalDirectory(root, fileStats);
                    return true;
                },
                function(){
                    finish();
                }
            );                
}

/**
* get one artical as html format.
* return data format: {articalHTML: 'xxxxxx'}
* input param format: title=xxxxx
*/
function getArticalAsHTML(request, response){

            //artical meta is null, not initialized, then initialize it
            if ( allArticalMetaData.metaList.length === 0 ){
                walkArticalDirectorySync(function(){
                    getArticalAsHTMLInner(request, response);
                });
            }else{
                getArticalAsHTMLInner(request, response);
            }

}

function getArticalAsHTMLInner(request, response){
            request.setEncoding('utf8');

            var clientData = url.parse(request.url).query;
            var clientParam = queryString.parse(clientData);
            console.log(clientParam);
            var path = getAbsolutePathByTitleSync(clientParam.title, clientParam.writer);
            console.log('read file from path: ' + path);

            var ret = {articalHTML: '', articalMD: ''};
            fs.readFile(path, 'utf8', function( err, data ){
                if ( err ){
                    console.log(err);
                    ret.articalHTML = '<h3>Sorry there are some error in the server...</h3>';
                }else{
                    
                    ret.title = clientParam.title;
                    var stat = readStatisticsSync(ret.title);
                    ret.viewCount = stat == null ? 0:stat.viewCount;
                    ret.writer = clientParam.writer;
                    ret.creationDateTime = getCreationDateTimeSync(clientParam.title, clientParam.writer);
                    var tmpary = path.split("/");
                    ret.category = tmpary[tmpary.length - 2];

                    //adujst the image path
                    data = adjustImagePathSync(data, ret.writer, ret.category);
                    ret.articalHTML = converter.makeHtml(data);
                    ret.articalMD = data;

                    calcStatistics(ret.title);

                }
                //send back to client
                response.writeHead(200, {'Content-Type' : 'text/json'});
                response.write(JSON.stringify(ret));
                response.end();
            });    
}

function readStatisticsSync(title){
    var data = fs.readFileSync( ARTICAL_STATISTICS_PATH, 'utf8');
    if ( data == null || data == ''){
        return null;
    }
    var statArray = JSON.parse(data);
    var stat;
    for( var i = 0; i < statArray.length; i++ ){
        stat = statArray[i];
        if ( stat.title == title){
            return stat;
        }
    }
    return null;
}

//make view count +1 each time view the artical
function calcStatistics(title){
    fs.readFile( ARTICAL_STATISTICS_PATH, 'utf8', function(err, data){
        if ( err ){
            console.log("failed to calc statistics of artical: " + title);
        }else{
            var statArray = [];
            var stat;

            if ( data == null || data == ''){
                stat = {title: title, viewCount: 1};
                statArray.push(stat);

            }else{
                statArray = JSON.parse(data);
                var i = 0;
            
                var isFirstView = true;
                for(; i < statArray.length; i++ ){
                    stat = statArray[i];
                    if( stat.title == title ){
                        stat.viewCount = stat.viewCount + 1;
                        isFirstView = false;
                    }
                }
                //first view this artical, create the stat
                if ( isFirstView ){
                    stat = {title: title, viewCount: 1};
                    statArray.push(stat);
                }
            }

            //save the statistics file
            fs.writeFile( ARTICAL_STATISTICS_PATH, JSON.stringify(statArray), function(err){
                if ( err )
                    console.log("write statistics file back error, title = " + title);
            });
        }
    } );
}

//pre-prend the image src with path: /data/articals/${writer}/${category}/
function adjustImagePathSync(text, writer, category){
    return text.replace(/!\[image\]\(/g, '![image](/' + writer + '/' + category + '/');
}

function newArtical(request, response){
    //check permission
    authMgmg.isSingin(request, function( err, isSingin ){
        if ( err || ! isSingin ){
            console.log('not signin, redirect to /signin');
            response.writeHead(302, {'Location' : '/signin'});
            response.end();
        }else{
                request.setEncoding("utf8");
                var articalOjb = request.body;
                console.log(articalOjb);
                var filename = ARTICAL_PATH + '/' + articalOjb.title + '.md';
                var artical = articalOjb.artical;
                var backData = {status: 0, error: ''};

                fs.writeFile(filename, artical, {encoding: 'utf8'}, function(err){
                    if ( err ){
                        backData.status = 1;
                        backData.error = err;
                    }else{
                        backData.status = 0;
                        backData.error = '';
                    }

                    //write back
                    response.writeHead(200, {'Content-Type' : 'text/json'});
                    response.write(JSON.stringify(backData));
                    response.end();
                });
        }//end else
    });
}

function getAbsolutePathByTitleSync(title, writer){
    if ( ! allArticalMetaData || allArticalMetaData.metaList.length === 0 ){
        return null;
    }

    var tmp;
    for ( var i = 0; i < allArticalMetaData.metaList.length; i++ ){
        tmp = allArticalMetaData.metaList[i];
        if ( title == tmp.title && writer == tmp.writer ){
            return tmp.absolutePath;
        }
    }
    return null;
}

function getCreationDateTimeSync(title, writer){
    if ( ! allArticalMetaData || allArticalMetaData.metaList.length === 0 ){
        return "";
    }
    var tmp;
    for ( var i = 0; i < allArticalMetaData.metaList.length; i++ ){
        tmp = allArticalMetaData.metaList[i];
        if ( title == tmp.title && writer == tmp.writer ){
            return tmp.creationDateTime;
        }
    }
    return "";

 
}

/*
* Response of url '/article/writer/?name=xxxx', query articles by writer name.
* input: ?name=xxxx
*
* output: 
* {writer: {name: xxxx, desc: xxxx, articles: [{title: xxx, category: xxx, viewCount: xxxx, lastModified: xxxx}]}}
**/
function getAllArticleByWriter(request, response){
    //if article meta data not initialized, initialize it.
    if ( allArticalMetaData.metaList.length === 0 ){
        walkArticalDirectorySync(function(){
            getAllArticleByWriterInner(request, response);
        });
    }else{
        getAllArticleByWriterInner(request, response);
    }
}

function getAllArticleByWriterInner(request, response){
    console.log('request.url = ' + request.url);
    var clientData = url.parse(request.url).query;
    console.log('client data = ' + clientData);
    var clientParam = queryString.parse(clientData);
    console.log(clientParam);
    userMgr.findUserByName(clientParam.name, function( err, user){
        //user of name not exist 
        if ( err ){
            response.writeHead(404, {"Content-Type" : "text/plain"});
            response.write('Can not find user by name <' + clientParam.name + '>');
            response.end();
        }else{
            //article meta data already ready
            var resp = {writer: {name: user.name, desc: user.desc, articles: [] } };
            var meta;
            for ( var i = 0; i < allArticalMetaData.metaList.length; i++ ){
                meta = allArticalMetaData.metaList[i];
                if ( meta.writer == user.name ){
                    var article = {title: '', viewCount: '', category: '', lastModified: ''};
                    article.title = meta.title;
                    article.category = meta.category;
                    article.viewCount = meta.viewCount;
                    article.lastModified = meta.creationDateTime;
                    resp.writer.articles.push(article);
                }
            }
            response.writeHead(200, {"Content-Type" : "text/plain"});
            response.write(JSON.stringify(resp));
            response.end();
        }
    });
}

exports.getAllArticalMetaData = getAllArticalMetaData;
exports.getArticalAsHTML = getArticalAsHTML;
exports.newArtical = newArtical;
exports.getAllArticleByWriter = getAllArticleByWriter;
