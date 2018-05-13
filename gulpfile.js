const gulp = require('gulp');
const cssnano = require('gulp-cssnano');
const connect = require('gulp-connect');

// copy image files to the build folder
gulp.task('copy-images', function() {
  return gulp.src('src/img/*') 
    .pipe(gulp.dest('build/img'))  
});

// copy json files to the build folder
gulp.task('copy-json', function() {
  return gulp.src('src/data/*.json')
    .pipe(gulp.dest('build/data'))
});

// Minify and copy CSS files to the build folder
gulp.task('min-css', function() {
  return gulp.src('src/css/*.css')
    .pipe(cssnano())
    .pipe(gulp.dest('build/css'))
    .pipe(connect.reload());
});

// Copy all JS to the build folder
gulp.task('copy-js', function() {
  return gulp.src('src/js/*.js')
    .pipe(gulp.dest('build/js'))
    .pipe(connect.reload());
});

// copy HTML to build folder
gulp.task('copy-html', function() {
  gulp.src('src/*.html')
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
})

// copy SW to build folder
gulp.task('copy-sw', function() {
  gulp.src('src/sw.js')
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
})

// Serve Application on localhost
gulp.task('serve', function() {
  connect.server({
    base: 'http://localhost',
    port: 8000,
    root: 'build',
    livereload: true
  });
});

gulp.task('watch', function() {
  gulp.watch('src/css/*.css', ['min-css']);
  gulp.watch('src/js/*.js', ['copy-js']);
  gulp.watch('src/*.html', ['copy-html']);
  gulp.watch('src/sw.js', ['copy-sw']);
})

gulp.task('default', ['copy-images', 'copy-json', 'min-css', 'copy-js', 'copy-html', 'copy-sw', 'serve', 'watch']);