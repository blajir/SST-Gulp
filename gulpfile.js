// 共通機能
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const rimraf = require('rimraf');
const runSequence = require('run-sequence');
const notifier = require('node-notifier');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
// webpackの設定ファイルの読み込み
const webpackConfig = require('./webpack.config');

// ejs
const ejs = require('gulp-ejs');
const prettify = require('gulp-prettify');

// gulp-sass
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');

// gulp-webserver
const webserver = require('gulp-webserver');
const browserSync = require('browser-sync').create();

// eslint
const eslint = require('gulp-eslint');

// javascript
const uglify = require('gulp-uglify');

// sitemap
var sitemap = require('gulp-sitemap');


// 共通変数
const global = {
  src: './src',
  dist: './dist',
  build: './build',
  scss: './src/**/*.scss',
  ejs: './src/**/*.ejs',
  js: './src/**/*.js',
  excludeFile: {
    scss: '!./src/**/_*.scss',
    ejs: '!./src/**/_*.ejs'
  }
};


// ejs modules
const setPath = require('./ejs_modules/setPath');
const setPathArray = {
  // ルート相対フラグ （true:ルート相対, false:ファイル相対 初期値false）
  rootpath: false,
  // 作業フォルダの設定
  initpath: process.env.INIT_CWD + '\\src\\'
}

// gulp-ejs
gulp.task('ejs', () => {
  // ejs変換
  return gulp.src([global.ejs, global.excludeFile.ejs])
    .pipe(ejs({ setPathArray, setPath }, {}, {'ext': '.html'}))
    .pipe(prettify({
      indent_with_tabs: false,
      indent_size: 2,
      max_preserve_newlines: 1,
      preserve_newlines: true,
      unformatted: [
        'b', 'big', 'i', 'small', 'tt', 'abbr', 'acronym',
        'cite', 'code', 'dfn', 'em', 'kbd', 'strong', 'samp',
        'time', 'var', 'a', 'bdo', 'br', 'img', 'map', 'object',
        'q', 'span', 'sub', 'sup', 'button', 'input',
        'label', 'select', 'textarea',
      ]
    }))
    .pipe(gulp.dest(global.dist));
});

// sitemap
gulp.task('sitemap', () => {
  gulp.src([global.dist + '/**/*.html', '!' + global.dist + '/_filelist.html'], {
      read: false
    })
    .pipe(sitemap({
      siteUrl: './'
    }))
    .pipe(gulp.dest(global.dist));
});

// gulp-scss
gulp.task('sass', () => {
  return gulp.src([global.scss, global.excludeFile.scss])
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(sourcemaps.write({includeContent: false}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(autoprefixer({
      browsers: ["last 2 versions", "ie >= 11", "Android >= 4","ios_saf >= 8"],
      cascade: false
    }))
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe(gulp.dest(global.dist));
});

// gulp-scss (Exclusion SOURCEMAP)
gulp.task('sass-build', () => {
  return gulp.src([global.scss, global.excludeFile.scss])
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gcmq())
    .pipe(autoprefixer({
      browsers: ["last 2 versions", "ie >= 11", "Android >= 4","ios_saf >= 8"],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(global.dist));
});

// gulp-uglify
gulp.task('minify', () => {
  gulp.src(global.dist + '/js/*.*')
    .pipe(uglify())
    .pipe(gulp.dest(global.build + '/js'));
});

// fileCopy
gulp.task('copy', () => {
  return gulp.src([global.src + '/**/*.*', '!' + global.ejs, '!' + global.scss, '!' + global.js])
    .pipe(gulp.dest(global.dist));
});

// fileCopy
gulp.task('build-copy', () => {
  return gulp.src([global.dist + '/**/*.*', '!' + global.dist + '/js/*.*' ])
    .pipe(gulp.dest(global.build));
});

// Webサーバー
gulp.task('browserSync', () => {
    browserSync.init({
        server: {
            baseDir: global.dist
        },
        open: 'external', //localhostではなくローカルIPでWebサーバー立ち上げ
        startPath: './_filelist.html'　//初期表示ページを指定
    });
});

gulp.task('bs-reload', () => {
  browserSync.reload();
})

// webpack
gulp.task('webpack', () => {
  return webpackStream(webpackConfig, webpack)
    .pipe(gulp.dest('./dist/js'));
});

// watch
gulp.task('watch', ['copy'], () => {
  gulp.watch([global.ejs, global.excludeFile.ejs], ['ejs']);
  gulp.watch([global.scss, global.excludeFile.scss], ['sass']);
  gulp.watch([global.js], ['webpack']);
  gulp.watch([global.src + '/**/*.*', global.excludeFile.scss, global.excludeFile.ejs], ['copy']);
});

// delete-dist
gulp.task('delete-dist', (cb) => {
  rimraf(global.dist, cb);
});

// delete-build
gulp.task('delete-build', (cb) => {
  rimraf(global.build, cb);
});

// Default
gulp.task('default', (callback) => {
  runSequence(['sass', 'ejs', 'copy', 'webpack'], 'sitemap', 'browserSync', 'watch', callback);
});

// build 納品ファイル作成
gulp.task('build', (callback) => {
  runSequence('delete-dist', ['sass-build', 'ejs', 'copy', 'webpack'], 'delete-build', 'build-copy', 'minify', 'delete-dist', callback);
});

// eslint
gulp.task('lint', () => {
  return gulp.src([global.js])
    .pipe(plumber({
      // エラーをハンドル
      errorHandler: (error) => {
        var taskName = 'eslint';
        var title = '[task]' + taskName + ' ' + error.plugin;
        var errorMsg = 'error: ' + error.message;
        // ターミナルにエラーを出力
        console.error(title + '\n' + errorMsg);
        // エラーを通知
        notifier.notify({
          title: title,
          message: errorMsg,
          time: 3000
        });
      }
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(plumber.stop());
});
