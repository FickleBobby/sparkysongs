const gulp = require("gulp");
const fLog = require("fancy-log");
const ansicolors = require("ansi-colors");
const sass = require("gulp-sass");
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const through2 = require("through2");

// gulp-uglify with uglify-es for ES6+ support
(uglifyEs = require("uglify-es")),
	(composer = require("gulp-uglify/composer")),
	(uglify = composer(uglifyEs, console)),
	(jshint = require("gulp-jshint")),
	(header = require("gulp-header")),
	(rename = require("gulp-rename")),
	(concat = require("gulp-concat")),
	(cssnano = require("gulp-cssnano")),
	(sourcemaps = require("gulp-sourcemaps")),
	(nunjucksRender = require("gulp-nunjucks-render")),
	(del = require("del")),
	(imagemin = require("gulp-imagemin")),
	(server = require("gulp-server-livereload")),
	(pkg = require("./package.json"));

const banner = [
	"/*!",
	` * ${pkg.name}`,
	` * ${pkg.title}`,
	" *",
	` * Url: ${pkg.url}`,
	` * Author: ${pkg.author}`,
	` * Copyright 2019-${new Date().getFullYear()}. ${pkg.license} licensed.`,
	" */",
	"",
].join("\n");

/*
 * CONFIGURATION
 * If you want to build files to a different directory simply modify the configuration below!
 */
const srcBase = "public/src/",
	destBase = "public/build/";
const paths = {
	// html is in build/*
	html: {
		src: srcBase + "html/**/*.html",
		templatesSrc: srcBase + "html/_templates/",
		dest: destBase,
	},
	// css is in build/assets/css/style[.min].css
	stylesheets: {
		src: srcBase + "sass/screen.scss",
		dest: destBase + "css/",
	},
	// js is in build/assets/js/*
	// external js is in build/assets/js/external/**/*.js
	js: {
		srcMain: srcBase + "js/*.js",
		srcExternal: srcBase + "js/external/**/*.js",
		dest: destBase + "js/",
	},
	// images are in build/assets/img/*
	img: {
		src: srcBase + "images/**/*.{png,gif,jpg,bmp,tiff,jpeg,webp}",
		dest: destBase + "images/",
	},
	// other files are copied recursively to build/assets/
	other: {
		src: srcBase + "other/**/*",
		dest: destBase + "assets/",
	},
};

const customNunjucksEnv = {
	// functions that process the passed arguments
	filters: {},
	// globals can be either variables or functions
	globals: {},
};

/*
 * SCSS, JS and HTML preprocessing
 */
function css() {
	return (
		gulp
			.src(paths.stylesheets.src)
			.pipe(rename("screen.css"))
			.pipe(sourcemaps.init())
			// Compile scss and prefix
			.pipe(sass().on("error", sass.logError))
			.pipe(autoprefixer())
			// Create two files: style.css and style.css.min
			.pipe( through2.obj( function( file, enc, cb ) {
				var date = new Date();
				file.stat.atime = date;
				file.stat.mtime = date;
				cb( null, file );
			}) )
			.pipe(gulp.dest(paths.stylesheets.dest))
			// Compress css, etc.
			.pipe(cssnano())
			.pipe(rename({ suffix: ".min" }))
			.pipe(header(banner))
			.pipe(sourcemaps.write())
			// Write the minified file
			.pipe( through2.obj( function( file, enc, cb ) {
				var date = new Date();
				file.stat.atime = date;
				file.stat.mtime = date;
				cb( null, file );
			}) )
			.pipe(gulp.dest(paths.stylesheets.dest))
	);
}

function jsMain() {
	return (
		gulp
			.src(paths.js.srcMain, { since: gulp.lastRun(jsMain) })
			.pipe(concat("main.js"))
			.pipe(sourcemaps.init())
			// Check against .jshintrc rules
			.pipe(jshint(".jshintrc"))
			.pipe(jshint.reporter("default"))
			// Create two files: scripts.js and scripts.js.min
			.pipe(header(banner))
			.pipe( through2.obj( function( file, enc, cb ) {
				var date = new Date();
				file.stat.atime = date;
				file.stat.mtime = date;
				cb( null, file );
			}) )
			.pipe(gulp.dest(paths.js.dest))
			// minify js and log errors
			.pipe(uglify())
			.on("error", function (err) {
				fLog(ansicolors.red("[Error]]"), err.toString());
			})
			.pipe(header(banner))
			.pipe(rename({ suffix: ".min" }))
			.pipe(sourcemaps.write())
			// Write the minified file
			.pipe( through2.obj( function( file, enc, cb ) {
				var date = new Date();
				file.stat.atime = date;
				file.stat.mtime = date;
				cb( null, file );
			}) )
			.pipe(gulp.dest(paths.js.dest))
	);
}

function jsExternal() {
	// Just copy the external js files
	return gulp
		.src(paths.js.srcExternal, { since: gulp.lastRun(jsExternal) })
		.pipe( through2.obj( function( file, enc, cb ) {
			var date = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe(gulp.dest(paths.js.dest));
}

function html() {
	// TODO test
	const manageEnvFn = function (env) {
		// Add filters
		for (let [key, value] of Object.entries(customNunjucksEnv.filters)) {
			env.addFilter(key, value);
		}
		// Add globals
		for (let [key, value] of Object.entries(customNunjucksEnv.globals)) {
			env.addGlobal(key, value);
		}
	};

	return gulp
		.src(paths.html.src, { since: gulp.lastRun(html) })
		.pipe(
			nunjucksRender({
				ext: ".html",
				inheritExtension: false,
				path: paths.html.templatesSrc,
				manageEnv: manageEnvFn,
			})
		)
		.pipe( through2.obj( function( file, enc, cb ) {
			var date = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe(gulp.dest(paths.html.dest));
}

/*
 * OTHER TASKS
 */
function copyOther() {
	return gulp
		.src(paths.other.src, { since: gulp.lastRun(copyOther) })
		.pipe( through2.obj( function( file, enc, cb ) {
			var date = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe(gulp.dest(paths.other.dest));
}

function images() {
	return gulp
		.src(paths.img.src)
		.pipe(imagemin({ verbose: true }))
		.pipe( through2.obj( function( file, enc, cb ) {
			var date = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe(gulp.dest(paths.img.dest));
}

function cleanDist() {
	return del(destBase + "**/*");
}

/*
 * BROWSER SYNC
 */
function initBrowserSync() {
	browserSync.init({
		server: {
			baseDir: destBase,
		},
		reloadDelay: 350,
		files: [`${destBase}/**/*.*`],
	});
}

function reload(done) {
	browserSync.reload({ stream: false });
	done();
}

function webserver() {
	gulp.src("app").pipe(
		server({
			livereload: true,
			directoryListing: true,
			open: true,
		})
	);
}

/*
 * WATCHERS
 */
function watchCss() {
	return gulp.watch(`${srcBase}sass/**/*.scss`, css);
}

function watchJsMain() {
	return gulp.watch(`${srcBase}js/*.js`, jsMain);
}

function watchJsExternal() {
	return gulp.watch(`${srcBase}js/external/*.js`, jsExternal);
}

function watchHtml() {
	return gulp.watch(
		[`${srcBase}html/**/*.html`, `${srcBase}templates/**/*.njk`],
		html
	);
}

function watchOther() {
	return gulp.watch(`${srcBase}other/**/*`, copyOther);
}

/*
 * EXPORTED TASKS
 */
exports.css = css;
exports.js = gulp.parallel(jsMain, jsExternal);
exports.html = html;
exports.images = images;
exports.other = copyOther;

exports.build = gulp.parallel(css, jsMain, jsExternal, html, images, copyOther);

exports.watch = gulp.parallel(
	watchCss,
	watchJsMain,
	watchJsExternal,
	watchHtml,
	watchOther
);
exports.clean = cleanDist;
exports.reload = reload;

exports.default = gulp.series(
	exports.clean,
	exports.build,
	gulp.parallel(exports.watch, initBrowserSync)
);
