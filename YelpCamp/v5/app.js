var express     = require('express'),
    bodyParser  = require('body-parser'),
    mongoose    = require('mongoose'),
    app         = express(),
    Campground = require('./models/campground'),
    seedDB = require('./seeds'),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    Comment = require('./models/comment');


const config = {
    autoIndex:          false,
    useUnifiedTopology: true,
    useNewUrlParser:    true,
};
mongoose.connect("mongodb://localhost:27017/yelp_camp_v3",config);
var bodyParser = require("body-parser");
app.set('view engine', 'ejs');  
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
seedDB();

//passport configuration
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized:false,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});


// Campground.create({
//     name: "SALMAN", 
//     image: "https://pixabay.com/get/52e3d3404a55af14f1dc84609620367d1c3ed9e04e5074417d2b79d6904bc5_340.png"
// }, function(err,campground){
//     if(err){
//         console.log("Oops! there's an ERROR");
//         console.log(err);
//     }else{
//         console.log("Newly Created Campground!")
//         console.log(campground);
//     }
// });

app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/campgrounds', (req, res) => {
    Campground.find({},function(err,allCampgrounds){
        if(err){
            console.log(err);
        }else{
            res.render("campgrounds/index",{campgrounds:allCampgrounds,currentUser:req.user});
        }
    });
});

app.post('/campgrounds', (req, res) => {
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCampground = {name:name,image:image,description:desc};
    Campground.create(newCampground,function(err,newlyCreated){
        if(err){
            console.log(err);
        }else{
            res.redirect('/campgrounds');
        }
    });
});

app.get('/campgrounds/new', (req, res) => {
    res.render("campgrounds/new");
});

//SHOW 
app.get('/campgrounds/:id', (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }else{
            //console.log(foundCampground);
            res.render('campgrounds/show',{campground:foundCampground});
        }
    });
});

//COMMENTS ROUTES

app.get('/campgrounds/:id/comments/new', isLoggedIn,(req, res) => {
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new",{campground: campground});
        }
    });
});

app.post('/campgrounds/:id/comments', isLoggedIn,(req, res) => {
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
             res.redirect('/campgrounds');
        }else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    console.log(err);
                }else{
                    campground.comments.push(comment);
                    campground.save();
                     res.redirect('/campgrounds/'+campground._id);
                }
            });
        }
    });
});


//Auth Routes
// 1. register

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', (req, res) => {
    var newUser = new User({username:req.body.username});
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req,res,function(){
             res.redirect('/campgrounds');
        });
    });
});


//show login form
app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"
}),(req, res) => {
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/campgrounds');
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
     res.redirect('/login');
}

app.listen(3000, () => {
    console.log('YelpCamp server started on port 3000');
});