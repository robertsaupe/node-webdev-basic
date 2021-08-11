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
let release_typ = "unknown";
let dest = build_root + '/' + release_typ;
let debugging = false;
//#endregion

//#region Essential Functions

const dest_stable = (cb) => {
    release_typ = "stable";
    dest = build_root + '/' + release_typ;
    debugging = false;
    return cb();
};

const dest_beta = (cb) => {
    release_typ = "beta";
    dest = build_root + '/' + release_typ;
    debugging = true;
    return cb();
};

const dest_alpha = (cb) => {
    release_typ = "alpha";
    dest = build_root + '/' + release_typ;
    debugging = true;
    return cb();
};

const dest_test = (cb) => {
    release_typ = "test";
    dest = build_root + '/' + release_typ;
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
const do_dev = gulp.series(serve, watch);
//#endregion

//#region Tasks
const task_clear = gulp.task('clear', do_clear);
const task_stable = gulp.task('stable', gulp.series(dest_stable, do_build));
const task_beta = gulp.task('beta', gulp.series(dest_beta, do_build));
const task_alpha = gulp.task('alpha', gulp.series(dest_alpha, do_build));
const task_test = gulp.task('test', gulp.series(dest_test, do_build));
const task_dev_stable = gulp.task('dev_stable', gulp.series(dest_stable, do_build, do_dev));
const task_dev_beta = gulp.task('dev_beta', gulp.series(dest_beta, do_build, do_dev));
const task_dev_alpha = gulp.task('dev_alpha', gulp.series(dest_alpha, do_build, do_dev));
const task_dev_test = gulp.task('dev_test', gulp.series(dest_test, do_build, do_dev));
//#endregion

//#region Exports
exports.default = task_stable;
exports.clear = task_clear;
exports.clean = task_clear;
exports.build = task_stable;
exports.release = task_stable;
exports.stable = task_stable;
exports.beta = task_beta;
exports.alpha = task_alpha;
exports.test = task_test;
exports.dev_build = task_dev_stable;
exports.dev_release = task_dev_stable;
exports.dev_stable = task_dev_stable;
exports.dev_beta = task_dev_beta;
exports.dev_alpha = task_dev_alpha;
exports.dev_test = task_dev_test;
//#endregion