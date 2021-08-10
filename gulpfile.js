//#region Imports

// Import important packages
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const noop = require("gulp-noop");
const del = require('del');
const fs = require('fs');
const browserSync = require('browser-sync').create();

// SASS -> CSS
const sass = require('gulp-sass')(require('sass'));
sass.compiler = require('sass');
const Fiber = require('fibers');
const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const cssBase64 = require("gulp-css-base64");

// HTML
const htmlmin = require('gulp-htmlmin');
const ejs = require('gulp-ejs');
const minifyInline = require('gulp-minify-inline');

// JavaScript
const terser = require('gulp-terser-js');

// Image
const ico = require('gulp-to-ico');
const imagemin = require('gulp-imagemin');

//#endregion

//#region Important Variables
const src = './src';
const build_root = './build';
const build_release = build_root + '/release';
const build_beta = build_root + '/beta';
const build_alpha = build_root + '/alpha';
const build_test = build_root + '/test';
const build_unknown = build_root + '/unknown';
let dest = build_unknown;
let release_typ = "unknown";
let debugging = false;
//#endregion

//#region Essential Functions

const dest_release = (cb) => {
    dest = build_release;
    release_typ = "release";
    return cb();
};

const dest_beta = (cb) => {
    dest = build_beta;
    release_typ = "beta";
    debugging = true;
    return cb();
};

const dest_alpha = (cb) => {
    dest = build_alpha;
    release_typ = "alpha";
    debugging = true;
    return cb();
};

const dest_test = (cb) => {
    dest = build_test;
    release_typ = "test";
    debugging = true;
    return cb();
};

const clear_dest = () => {
    return del([`${dest}`]);
};

const clear_build = () => {
    return del([`${build_root}`]);
};

const clear_hook = (cb) => {
    if (!fs.existsSync(build_root)) fs.mkdirSync(build_root);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    return cb();
};

//#endregion

//#region Build

// copy files
const copy_files = () => {
    return gulp.src(`${src}/copy/**/*`)
        .pipe(gulp.dest(`${dest}/`));
};

// compile .ejs to minified .html
const compile_ejs = () => {
    let dict = require(`${src}/ejs/dict.json`)
    return gulp.src(`${src}/ejs/page/**/*.ejs`)
        .pipe(plumber())
        .pipe(ejs(dict))
        .pipe(rename({ extname: '.html' }))
        .pipe(minifyInline())
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            html5: true,
            removeEmptyAttributes: true,
            sortAttributes: true,
            sortClassName: true
        }))
        .pipe(gulp.dest(`${dest}/`));
};

// compile css
const compile_css = () => {
    return gulp.src(`${src}/sass/**/*.{sass,scss}`)
        .pipe(plumber())
        .pipe(debugging ? sourcemaps.init() : noop())
        .pipe(sass({
            includePaths: ['./node_modules'],
            fiber: Fiber
        }).on('error', sass.logError))
        .pipe(cssBase64({maxWeightResource: 100000000000}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(debugging ? sourcemaps.write('') : noop())
        .pipe(gulp.dest(`${dest}/css`));
};

// compile js
const compile_js = () => {
    return gulp.src(`${src}/js/**/*.js`)
        .pipe(rename({ suffix: '.min' }))
        .pipe(debugging ? sourcemaps.init({ loadMaps: true }) : noop())
        .pipe(terser())
        .pipe(debugging ? sourcemaps.write('.') : noop())
        .pipe(gulp.dest(`${dest}/js/`));
};

// generate favicon.ico
const generate_favicon = () => {
    return gulp.src(`${src}/favicon.png`)
        .pipe(ico('favicon.ico', { resize: true, sizes: [16, 24, 32, 48, 64] }))
        .pipe(gulp.dest(`${dest}/`));
};

// minify img
const minify_img = () => {
    return gulp.src(`${src}/img/**/*.{png,svg,gif,jpg,jpeg}`)
        .pipe(imagemin())
        .pipe(gulp.dest(`${dest}/img/`));
};

//#endregion

//#region Live Develop

// Reload the browser
const reload = (done) => {
    browserSync.reload();
    done();
};

// Serve the dev-server in the browser
const serve = (done) => {
    browserSync.init({
        server: {
            baseDir: `${dest}`
        }
    });
    done();
};

// Watch changes and refresh page
const watch = () => gulp.watch(
    [
        `${src}/copy/**/*`,
        `${src}/ejs/**/*.{ejs,json,js}`,
        `${src}/img/**/*.{png,svg,gif,jpg,jpeg}`,
        `${src}/js/**/*.js`,
        `${src}/sass/**/*.{sass,scss}`
    ],
    gulp.series(
        do_build,
        reload
    )
);

//#endregion

//#region Do
const do_clear = gulp.series(clear_build);
const do_build = gulp.series(
    clear_dest,
    clear_hook,
    gulp.parallel(
        copy_files,
        compile_ejs,
        compile_css,
        compile_js,
        generate_favicon,
        minify_img
    )
);
const do_build_release = gulp.series(dest_release, do_build);
const do_build_beta = gulp.series(dest_beta, do_build);
const do_build_alpha = gulp.series(dest_alpha, do_build);
const do_build_test = gulp.series(dest_test, do_build);
const do_devbuild_release = gulp.series(dest_release, do_build, serve, watch);
const do_devbuild_beta = gulp.series(dest_beta, do_build, serve, watch);
const do_devbuild_alpha = gulp.series(dest_alpha, do_build, serve, watch);
const do_devbuild_test = gulp.series(dest_test, do_build, serve, watch);
//#endregion

//#region Tasks
const task_clear = gulp.task('clear', do_clear);
const task_clean = gulp.task('clean', do_clear);
const task_build = gulp.task('build', do_build_release);
const task_release = gulp.task('release', do_build_release);
const task_beta = gulp.task('beta', do_build_beta);
const task_alpha = gulp.task('alpha', do_build_alpha);
const task_test = gulp.task('test', do_build_test);
const task_dev_release = gulp.task('dev_release', do_devbuild_release);
const task_dev_beta = gulp.task('dev_beta', do_devbuild_beta);
const task_dev_alpha = gulp.task('dev_alpha', do_devbuild_alpha);
const task_dev_test = gulp.task('dev_test', do_devbuild_test);
//#endregion

//#region Exports
exports.default = task_release;
exports.clean = task_clean;
exports.clear = task_clear;
exports.build = task_build;
exports.release = task_release;
exports.beta = task_beta;
exports.alpha = task_alpha;
exports.test = task_test;
exports.dev_release = task_dev_release;
exports.dev_beta = task_dev_beta;
exports.dev_alpha = task_dev_alpha;
exports.dev_test = task_dev_test;
//#endregion