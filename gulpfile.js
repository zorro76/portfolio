// Requiring packages
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoPrefixer = require('gulp-autoprefixer'),
    minifyCSS= require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    minifyHTML = require('gulp-minify-html'),
    imageMin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    jsHint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    del = require('del'),
    gulpFilter = require('gulp-filter'),
    mainBowerFiles = require('main-bower-files'),
    connect = require('gulp-connect'),
    gulpIf = require('gulp-if'),
    svg2png = require('gulp-svg2png'),
    svgmin = require('gulp-svgmin'),
    svgSprites = require('gulp-svg-sprites'),
    size = require('gulp-size'),
    cssfont64 = require('gulp-cssfont64'),
    opn = require('opn');

// Declaring paths and variables
var src = {
        js: ['./src/js/**/*.js'],
        sass: ['./src/sass/main.{scss,sass}'],
        images: ['./src/img/**/*.*', './src/img/icons/*.svg', '!./src/img/icons/sprites/*.svg'],
        sprites: ['./src/img/icons/sprites/*.svg'],
        svg: ['./src/img/icons/*.svg'],
        fonts: ['./src/fonts/**/*.{woff,woff2}'],
        index: ['./src/index.html']
    },

    server = {
        host: 'localhost',
        port: '9000'
    },

    env,
    outputDir,
    sassStyle,
    sassComments;

// Configuring paths and options for different environments
env = process.env.NODE_ENV || 'dev';

if (env !== 'dev') {
    outputDir = 'builds/development/';
    sassStyle = 'expanded';
    sassComments = true;
} else {
    outputDir = 'builds/production/';
    sassStyle = 'compressed';
    sassComments = false;
}


/**********
 * ~TASKS~
 **********/

// Start webserver
gulp.task('webServer', function() {
    connect.server({
        root: outputDir,
        host: server.host,
        port: server.port,
        livereload: true
    });
});

// Open browser
gulp.task('openBrowser', function() {
    opn( 'http://' + server.host + ':' + server.port);
});

// ~ Clean ~
// Delete build folders
gulp.task('cleanDev', function() {
    del(['./builds/development'], function (err, deletedFiles) {
        console.log('Files deleted:', deletedFiles.join(', '));
    });
});

gulp.task('cleanProd', function() {
    del(['./builds/production'], function (err, deletedFiles) {
        console.log('Files deleted:', deletedFiles.join(', '));
    });
});

gulp.task('clean', function() {
    del(['./builds'], function (err, deletedFiles) {
        console.log('Files deleted:', deletedFiles.join(', '));
    });
});





// ~ Compile styles ~
var cssFilter = gulpFilter('**/*.css');

// Concat vendor CSS (uglify for production)
gulp.task('styles:vendor', function() {
  gulp.src(mainBowerFiles({
          "overrides": {
              "normalize.css": {
                  "main": "./normalize.css"
              },

              "magnific-popup": {
                  "main": "./dist/magnific-popup.css"
              },

              "slick-carousel": {
                  "main": [
                      "./slick/slick.css",
                      "./slick/slick-theme.css",
                      "./slick/fonts/*.*"
                  ]
              }
          }
  }))
  .pipe(cssFilter)
  .pipe(concat('vendor.css'))
  .pipe(gulpIf(env === 'dev', minifyCSS()))
  .pipe(gulp.dest(outputDir + 'css'))
});

// Concat own SASS (uglify for production)
gulp.task('styles', function() {
    gulp.src(src.sass)
    .pipe(sass({
            "sourcemap=none": true,
            noCache: true,
            compass: true,
            style: sassStyle,
            lineNumbers: sassComments
        }))
    .pipe(autoPrefixer())   
    .pipe(gulp.dest(outputDir + 'css'))
    .pipe(connect.reload())
});


// ~ Compile JS ~
var jsFilter = gulpFilter('**/*.js');

// Concat vendor JS (uglify for production)
gulp.task('js:vendor', function() {
    gulp.src(mainBowerFiles({
          "overrides": {
              "jquery": {
                  "main": "./dist/jquery.min.js"
              },

              "magnific-popup": {
                  "main": "./dist/jquery.magnific-popup.min.js"
              },

              "slick-carousel": {
                  "main": "./slick/slick.min.js"
              },

              "jquery.maskedinput": {
                  "main": "./dist/jquery.maskedinput.min.js"
              }
          }
  }))
      .pipe(jsFilter)
      .pipe(concat('vendor.js'))
      .pipe(gulpIf(env === 'dev', uglify()))
      .pipe(gulp.dest(outputDir + 'js'))
});

// Concat own JS (uglify for production)
gulp.task('js', function() {
    gulp.src(src.js)
        .pipe(jsHint())
        .pipe(jsHint.reporter('default'))
        .pipe(concat('script.js'))
        .pipe(gulpIf(env === 'dev', uglify()))
        .pipe(gulp.dest(outputDir + 'js'))
        .pipe(connect.reload());
});





// ~ Images ~
// Compress images and move 'em to output dir
gulp.task('images', function() {
    return gulp.src(src.images)
        .pipe(imageMin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(outputDir + 'img'))
        .pipe(connect.reload())
});


// ~ SVG ~
gulp.task('svg', function () {
    return gulp.src(src.svg)
        .pipe(svgmin())
        .pipe(size({
            title: 'SVG'
        }))
        .pipe(gulp.dest(outputDir + 'img/icons'))
        .pipe(connect.reload())
});

//SVG-sprite
gulp.task('sprite', function() {
    return gulp.src(src.sprites)
        .pipe(svgSprites(config = {
             selector: "icon-%f",
             cssFile: "_sprite.scss",
             svg: {
                sprite: "img/sprite.svg"
             },
             dimension: {
                 maxWidth: 16,
                 maxHeight: 16
             },
             baseSize: 16
        }))
         .pipe(gulp.dest('./src/sass'))
         .pipe(connect.reload())
 });


// ~ Fonts ~
// Convert fonts

gulp.task('fontsConvert', function () {
    return gulp.src(src.fonts)
        .pipe(cssfont64())
        .pipe(gulp.dest(outputDir + 'css'))
        .pipe(connect.reload())
});


// Copy index to output dir (minify for production)
gulp.task('index', function() {
    gulp.src(src.index)
        .pipe(gulpIf(env === 'dev', minifyHTML()))
        .pipe(gulp.dest(outputDir))
        .pipe(connect.reload())
});


// Watch for changes in /src directories
gulp.task('watch', function() {
    gulp.watch(src.js, ['js']);
    gulp.watch('./src/sass/*.sass', ['styles']);
    gulp.watch(src.index, ['index']);
    gulp.watch(src.images, ['images']);
    gulp.watch(src.svg, ['svg']);
    gulp.watch(src.fonts, ['fontsConvert']);
});



// ~Build tasks~
//Build dev version
gulp.task('build', ['styles:vendor', 'styles', 'js:vendor', 'js', 'images', 'sprite', 'fontsConvert', 'index']);

// Build and run dev environment
gulp.task('default', ['build', 'webServer', 'openBrowser', 'watch']);