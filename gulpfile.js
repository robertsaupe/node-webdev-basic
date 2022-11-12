//#region Imports

// Import important packages
import gulp from 'gulp';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps'
import noop from 'gulp-noop';
import {deleteAsync} from 'del';
import fs from 'fs';
import browserSyncModule from 'browser-sync';
const browserSync = browserSyncModule.create();

// SASS -> CSS
import sassModule from 'sass';
import gulpsassModule from 'gulp-sass';
const sass = gulpsassModule(sassModule);
sass.compiler = sassModule;
import Fiber from 'fibers';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import cssBase64 from 'gulp-css-base64';

// HTML
import htmlmin from 'gulp-htmlmin';
import ejs from 'gulp-ejs';
import minifyInline from 'gulp-minify-inline';

// JavaScript
import terser from 'gulp-terser-js';

// Image
import ico from 'gulp-to-ico';
import imagemin from 'gulp-imagemin';

//#endregion

//#region Important Variables

// Build
const src = './src';
const build_root = './build';
let release_typ = "unknown";
let dest = build_root + '/' + release_typ;
let debugging = false;
let date = {};

//#endregion

//#region Essential Functions

const release_stable = (cb) => {
    release_typ = "stable";
    debugging = false;
    return build_target(cb);
};

const release_beta = (cb) => {
    release_typ = "beta";
    debugging = true;
    return build_target(cb);
};

const release_alpha = (cb) => {
    release_typ = "alpha";
    debugging = true;
    return build_target(cb);
};

const release_test = (cb) => {
    release_typ = "test";
    debugging = true;
    return build_target(cb);
};

const clear_build_root = () => {
    return deleteAsync([`${build_root}`]);
};

const clear_build_dest = async (cb) => {
    await deleteAsync([`${dest}`]);
    if (!fs.existsSync(build_root)) fs.mkdirSync(build_root);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    return cb();
};

//#endregion

//#region Build

const build_target = (cb) => {
    dest = build_root + '/' + release_typ;
    date.obj = new Date();
    date.day = ("0" + date.obj.getDate()).slice(-2);
    date.month = ("0" + (date.obj.getMonth() + 1)).slice(-2);
    date.year = date.obj.getFullYear();
    date.hours = ("0" + date.obj.getHours()).slice(-2);
    date.minutes = ("0" + date.obj.getMinutes()).slice(-2);
    date.seconds = ("0" + date.obj.getSeconds()).slice(-2);
    date.format = {
        short:`${date.year}-${date.month}-${date.day}`,
        signature:`${date.year}-${date.month}-${date.day}-${date.hours}-${date.minutes}-${date.seconds}`,
        full:`${date.year}-${date.month}-${date.day} ${date.hours}:${date.minutes}:${date.seconds}`
    };
    return cb();
};

// copy files
const copy_files = () => {
    return gulp.src(`${src}/copy/**/*`)
        .pipe(gulp.dest(`${dest}/`));
};

// compile .ejs to minified .html
const compile_ejs = () => {
    var dict_content = fs.readFileSync(`${src}/ejs/dict.json`);
    var dict = JSON.parse(dict_content);
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
        build_target,
        do_build,
        reload
    )
);

//#endregion

//#region Do
const do_clear = gulp.series(clear_build_root);
const do_build = gulp.series(
    clear_build_dest,
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
const task_stable = gulp.task('stable', gulp.series(release_stable, do_build));
const task_beta = gulp.task('beta', gulp.series(release_beta, do_build));
const task_alpha = gulp.task('alpha', gulp.series(release_alpha, do_build));
const task_test = gulp.task('test', gulp.series(release_test, do_build));
const task_dev_stable = gulp.task('dev_stable', gulp.series(release_stable, do_build, do_dev));
const task_dev_beta = gulp.task('dev_beta', gulp.series(release_beta, do_build, do_dev));
const task_dev_alpha = gulp.task('dev_alpha', gulp.series(release_alpha, do_build, do_dev));
const task_dev_test = gulp.task('dev_test', gulp.series(release_test, do_build, do_dev));
//#endregion