// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");
// Importing all the Gulp-related packages we want to use
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const isChanged = require("gulp-changed");
const Minimize = require("gulp-minimize");
var clean = require("gulp-clean");

// File paths
const source = {
  path: "./source",
  htmlPath: "source/html/*.html",
  scssPath: "source/scss/**/*.scss",
  jsPath: "source/js/**/*.js",
  imagePath: "source/images/**/*.+(jpg|gif|png)",
};

const dist = {
  path: "dist",
  htmlPath: "./dist/",
  cssPath: "./dist/css",
  jsPath: "./dist/js",
  imagePath: "./dist/images",
};

function cleanTask() {
  return src(dist.path, { read: false }).pipe(clean());
}
exports.clean = cleanTask;

function htmlTask() {
  return src(source.htmlPath)
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: "Gulp error in " + err.plugin,
            message: err.message,
          })(err);
        },
      })
    )
    .pipe(Minimize())
    .pipe(dest(dist.htmlPath));
}
exports.html = htmlTask;

function scssTask() {
  return src(source.scssPath)
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: "Gulp error in " + err.plugin,
            message: err.message,
          })(err);
        },
      })
    )
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("."))
    .pipe(browserSync.stream())
    .pipe(dest(dist.cssPath));
}
exports.style = scssTask;

// todo: optimize
function optimizeImagesTask() {
  return src(source.imagePath)
    .pipe(isChanged("dist/images"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true, arithmatic: false }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("dist/images"));
}
exports.images = optimizeImagesTask;

// todo: optimize
function jsTask() {
  return (
    src([
      src.jsPath,
      //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
    ])
      .pipe(plumber())
      // .pipe(sourcemaps.init())
      .pipe(concat("all.js"))
      // .pipe(sourcemaps.write('.'))
      .pipe(uglify()) // production only
      .pipe(dest("dist"))
  );
}

var cbString = new Date().getTime();
function cacheBustTask() {
  return src(["index.html"])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("."));
}


function watchTask() {
  //browsersyncb
  browserSync.init({
    server: {
      baseDir: "./dist",
      open: false,
    },
  });

  // watch([files.scssPath, files.jsPath],
  // series(
  //     parallel(scssTask, jsTask),
  //     cacheBustTask
  //  )).on('change', browserSync.reload);
  watch(source.scssPath, scssTask);
  watch(source.htmlPath, htmlTask);
  watch(source.jsPath).on("change", browserSync.reload);
  watch(source.htmlPath).on("change", browserSync.reload);
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(cleanTask, htmlTask, scssTask, watchTask);
