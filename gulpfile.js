/*!
 * gulp
 * $ npm install gulp-swig gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
 */

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
	fs = require('graceful-fs'),
	swig = require('gulp-swig'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

	
// Error function
function swallowError (error) {
    //If you want details of the error in the console
    console.log(error.toString());
    this.emit('end');
}

// Filter for index.html
function getHtmlFiles() {
  return fs.readdirSync('./public/build').filter(function(file) {
    return file != 'index.html' && file.indexOf('.html') != -1;
  });
}

// Styles
gulp.task('styles', function() {
  return sass('public/src/sass/*.scss', { style: 'expanded' })
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('public/build/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cssnano())
    .pipe(gulp.dest('public/build/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// Scripts
gulp.task('scripts', function() {
  return gulp.src('public/src/js/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('public/build/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('public/build/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Images
gulp.task('images', function() {
  return gulp.src('public/src/images/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('public/build/images'))
    .pipe(notify({ message: 'Images task complete' }));
});


// Html build tasks

gulp.task('compile:html', function() {
  return gulp.src('public/src/html/*.html')
    .pipe(swig({
      defaults: {
        cache: false
      }
    }))
    .on('error', swallowError)
    .pipe(gulp.dest('public/build'))
});

gulp.task('html', ['compile:html'], function() {
  return gulp.src('public/src/html/fileindex.html')
    .pipe(swig({
      data: {
        files: getHtmlFiles()
      },
      defaults: {
        cache: false
      }
    }))
    .on('error', swallowError)
    .pipe(gulp.dest('public/build'))
    .pipe(livereload());
});


// Clean
gulp.task('clean', function() {
  return del(['public/build/css', 'public/build/js', 'public/build/images', 'public/build/*.html']);
});

// Default task
gulp.task('default', ['clean'], function() {
  gulp.start('html', 'styles', 'scripts', 'images', 'watch');
});

// Watch
gulp.task('watch', function() {

  // Watch .scss files
  gulp.watch('public/src/sass/**/*.scss', ['styles']);

  // Watch .js files
  gulp.watch('public/src/js/**/*.js', ['scripts']);

  // Watch image files
  gulp.watch('public/src/images/**/*', ['images']);

   // Watch html files
  gulp.watch('public/src/html/**/*', ['html']);

  
  // Create LiveReload server
  livereload.listen();

  // Watch any files in dist/, reload on change
  gulp.watch(['public/build/**']).on('change', livereload.changed);

});