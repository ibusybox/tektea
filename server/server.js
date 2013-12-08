
var express = require('express');

// pass the express to the connect redis module
// allowing it to inherit from express.session.Store
//var RedisStore = require('connect-redis')(express);
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();
var app = express();


//use a sceret key
app.use(express.cookieParser("blog.tektea.com"));
//app.use(express.session( {secret: 'store 4 lucy'} ));
// Populates req.session
app.use(express.session(
    { 
        /*cookie: {
            path: "/",
            httpOnly: true,
            maxAge: null
        },  */      
        key: 'blog.tektea.com', 
        secret: 'blog.tektea.com', 
        store: sessionStore })

);
///app.use(express.cookieSession());

//protect static files
var allowedPath = function(regex){
    return function(request, response, next){
        //allowed
        if (regex.test(request.url)) { return next(); }

        //not allowed
        response.writeHead(403, {'Content-Type' : 'text/html'});
        response.write('<h1>Forbidden Access</h1>')
        response.end();
    };
};

//app.use(express.favicon());

//product and /home/products are static html, script, jpg files
app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/data/articals'));

//allowed path list
//   /data/articals 2 level sub-directories image files are allowned, other files are not allowed
//app.use(allowedPath(/^\/articals\/.*\/.*\/.*(\.jpg)|(\.jpeg)|(\.png)|(\.gif)$/));


var utils = require('./utils');
//image upload
//set up file upload https://github.com/aguidrevitch/jquery-file-upload-middleware
var upload = require('jquery-file-upload-middleware');
upload.configure({
        imageVersions: {
            thumbnail: {
                width: 80,
                height: 80
            }
        }
    });

//the upload url pattern should be: /upload/?album=xxx
app.use('/upload', function (request, response, next){
    var teamName = request.session.currentTeam;
    var albumName = utils.getRequestParam(request)['album'];
    var slashIndex = albumName.indexOf('/');
    //i dont know why jquery file upload component will append photo name in the url, like this: /upload/?album=xxx/me.jpg
    if ( slashIndex != -1 ){
        albumName = albumName.substring(0, slashIndex);
    }
    console.log('teamName = ' + teamName + ', albumName = ' + albumName);
    if ( ! teamName || ! albumName ){
        next();
    }else{
        upload.fileHandler(
            {
                uploadDir: function(){
                    return process.cwd() + '/server/data/public/protected/' + teamName + '/' + albumName;
                },
                uploadUrl: function(){
                    return '/protected/' + teamName + '/' + albumName;
                }
            }
        )(request, response, next);
    }
});


//use body parser. express.bodyParser should be after than the upload, because of the conflition
//use body parser, then no need use request.on("data",...) to receive client json post data, just request.body is the json object
app.use( express.bodyParser( /*{uploadDir: __dirname + '/uploads'}*/ ) );

//auth management
var utils = require('./utils');
var authMgmt = require('./usermgmt/auth_question');
var articalMgmt = require('./articalmgmt/articalmgmt');
var albumMgmt = require('./albummgmt/albummgmt');

//home page
app.get('/', function(request, response){
    utils.writeHTML2Client(__dirname + '/static/main/main.html', response);
} );

app.get('/artical', function(request, response){   
    utils.writeHTML2Client(__dirname + '/static/main/artical_content.html', response);
});

app.get('/artical/meta', articalMgmt.getAllArticalMetaData);
app.get('/artical/content', articalMgmt.getArticalAsHTML);

app.get('/search', function(request, response){   
    utils.writeHTML2Client(__dirname + '/static/main/search.html', response);
});


app.get('/artical/new', function(request, response){
    authMgmt.checkSingin(request, response, function(){
        utils.writeHTML2Client(__dirname + '/static/20434/artical_new.html', response);
    });    
});

app.post('/artical/new/json', articalMgmt.newArtical);

app.get('/albums', function(request, response){
    authMgmt.checkSingin(request, response, function(){
        utils.writeHTML2Client(__dirname + '/static/20434/album.html', response);
    });
});
app.get('/albums/edit', function(request, response){
    authMgmt.checkSingin(request, response, function(){
        utils.writeHTML2Client(__dirname + '/static/20434/upload.html', response);
    });
});
app.get('/albums/meta', albumMgmt.getAlbumMeta);
app.post('/albums/new', albumMgmt.createAlbum);


app.listen(80);

console.log("app listening on port 80.");