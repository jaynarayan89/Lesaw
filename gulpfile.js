// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const isChanged = require('gulp-changed');
const Minimize = require('gulp-minimize');



// File paths
const srcFiles = { 
    htmlPath: 'app/*.html',
    scssPath: 'app/scss/**/*.scss',
    jsPath: 'app/js/**/*.js',
    imagePath: 'app/images/**/*.+(jpg|gif|png)'
}

// todo: use everwher this 
const distFiles = { 
    htmlPath: 'app/*.html',
    scssPath: 'app/scss/**/*.scss',
    jsPath: 'app/js/**/*.js',
    imagePath: 'app/images/**/*.+(jpg|gif|png)'
}


//html minify
function optimizeHtmlTask(){    
return src('app/*.html')
.pipe(plumber({ errorHandler: function(err) {
    notify.onError({
        title: "Gulp error in " + err.plugin,
        message:  err.message //toString()
    })(err);
}}))
	.pipe(Minimize())
    .pipe(browserSync.reload())
	.pipe(dest('.'));
};
exports.html = optimizeHtmlTask;
//image task

function optimizeImagesTask(){ 
         return src(srcFiles.imagePath)
         .pipe(isChanged('dist/images'))
         .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true, arithmatic:false}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('dist/images'))
}
exports.images = optimizeImagesTask;

// Sass task: compiles the style.scss file into style.css
function scssTask(){    
    return src(srcFiles.scssPath)
    .pipe(plumber({ errorHandler: function(err) {
        notify.onError({
            title: "Gulp error in " + err.plugin,
            message:  err.message //toString()
        })(err);
    }}))
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
        .pipe(browserSync.stream())
        .pipe(dest('dist')
    ); // put final CSS in dist folder
}
exports.style = scssTask;

// JS task: concatenates and uglifies JS files to script.js
function jsTask(){
    return src([
        srcFiles.jsPath
        //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
        ])
        .pipe(plumber())
       // .pipe(sourcemaps.init())
        .pipe(concat('all.js'))
       // .pipe(sourcemaps.write('.'))
        .pipe(uglify()) // production only
        .pipe(dest('dist')
    );
}

// Cachebust
var cbString = new Date().getTime();
function cacheBustTask(){
    return src(['index.html'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
        .pipe(dest('.'));
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask(){
    //browsersyncb
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });


    // watch([files.scssPath, files.jsPath], 
        // series(
        //     parallel(scssTask, jsTask),
        //     cacheBustTask
        //  )).on('change', browserSync.reload);
    watch(srcFiles.scssPath,scssTask);
    watch(srcFiles.jsPath).on('change',browserSync.reload);
    watch(srcFiles.htmlPath).on('change',browserSync.reload);
//    watch(srcFiles.htmlPath).on('change',optimizeHtmlTask);
  
}



// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default =  watchTask;