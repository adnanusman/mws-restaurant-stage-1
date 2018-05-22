const gulp = require('gulp');
const cssnano = require('gulp-cssnano');
// const connect = require('gulp-connect');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const webp = require('gulp-webp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

// copy image files to the build folder
gulp.task('copy-images', function() {
  return gulp.src('src/img/*') 
    .pipe(imagemin({
      progressive: true,
      use: [pngquant()]
    }))
    .pipe(gulp.dest('build/img'))  
});

// convert images to webp
gulp.task('images-webp', function() {
  return gulp.src('src/img/*')
    .pipe(webp())
    .pipe(gulp.dest('build/img'))
})

// copy json files to the build folder
gulp.task('copy-json', function() {
  return gulp.src('src/data/*.json')
    .pipe(gulp.dest('build/data'))
});

// Minify and copy CSS files to the build folder
gulp.task('min-css', function() {
  return gulp.src('src/css/*.css')
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('build/css'))
    // .pipe(connect.reload())
});

// Copy all JS to the build folder
gulp.task('copy-js', function() {
  return gulp.src('src/js/*.js')
    .pipe(babel())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'))
    // .pipe(connect.reload())
});

// copy HTML to build folder
gulp.task('copy-html', function() {
  gulp.src('src/*.html')
    .pipe(gulp.dest('build'))
    // .pipe(connect.reload())
})

// copy SW to build folder
gulp.task('copy-sw', function() {
  browserify('src/sw.js')
    .transform(babelify)
    .bundle()
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    .pipe(source('sw.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build'))
    // .pipe(connect.reload())
})

// Serve Application on localhost
gulp.task('serve', function() {
  browserSync.init({
    server: "./build",
    port: 8000
  });
  browserSync.stream();
  // connect.server({
  //   base: 'http://localhost',
  //   port: 8000,
  //   root: 'build',
  //   livereload: true
  // });
});

gulp.task('lint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src(['**/*.js','!node_modules/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    // .pipe(eslint.failAfterError());
});

gulp.task('watch', function() {
  gulp.watch('src/css/*.css', ['min-css']).on('change', browserSync.reload);
  gulp.watch('src/js/*.js', ['lint', 'copy-js']).on('change', browserSync.reload);
  gulp.watch('src/*.html', ['copy-html']).on('change', browserSync.reload);
  gulp.watch('src/sw.js', ['copy-sw']).on('change', browserSync.reload);
})

gulp.task('default', ['copy-images', 'images-webp', 'copy-json', 'min-css', 'copy-js', 'copy-html', 'copy-sw', 'watch', 'lint', 'serve']);