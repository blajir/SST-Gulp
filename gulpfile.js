// 共通機能
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var notifier = require('node-notifier');

// ejs
var ejs = require('gulp-ejs');
var rename = require('gulp-rename');
var prettify = require('gulp-prettify');

// gulp-less
var less = require('gulp-less');
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({
  browsers: ['last 5 versions']
});

// gulp-sass
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var gcmq = require('gulp-group-css-media-queries');

// gulp-webserver
var webserver = require('gulp-webserver');
var browserSync = require('browser-sync').create();

// eslint
var eslint = require('gulp-eslint');

// javascript
var uglify = require('gulp-uglify');

// 共通変数
var global = {
  src: './src',
  dist: './dist',
  build: './build',
  less: './src/**/*.less',
  scss: './src/**/*.scss',
  ejs: './src/**/*.ejs',
  js: './src/**/*.js',
  excludeFile: {
    less: '!./src/**/_*.less',
    scss: '!./src/**/_*.scss',
    ejs: '!./src/**/_*.ejs'
  }
};


// ejs modules
var setPath = require('./ejs_modules/setPath');
var setPathArray = {
  // ルート相対フラグ （true:ルート相対, false:ファイル相対 初期値false）
  rootpath: false,
  // 作業フォルダの設定
  initpath: process.env.INIT_CWD + '\\src\\'
}

// gulp-ejs
gulp.task('ejs', function () {
  // ejs変換
  return gulp.src([global.ejs, global.excludeFile.ejs])
    .pipe(ejs({ setPathArray, setPath }))
    .pipe(rename(function (path) {
      path.extname = '.html';
    }))
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

// gulp-less
gulp.task('less', function () {
  return gulp.src([global.less, global.excludeFile.less])
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe(less({
      sourceMap: {
        sourceMapFileInline: true
      },
      plugins: [autoprefix]
    }))
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe(gulp.dest(global.dist));
});

// gulp-less (Exclusion SOURCEMAP)
gulp.task('less-build', function () {
  return gulp.src([global.less, global.excludeFile.less])
    .pipe(less({
      plugins: [autoprefix]
    }))
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(global.dist));
});

// gulp-scss
gulp.task('sass', function () {
  return gulp.src([global.scss, global.excludeFile.scss])
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 5 versions'],
      cascade: false
    }))
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe(gulp.dest(global.dist));
});

// gulp-scss (Exclusion SOURCEMAP)
gulp.task('sass-build', function () {
  return gulp.src([global.scss, global.excludeFile.scss])
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gcmq())
    .pipe(autoprefixer({
      browsers: ['last 5 versions'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(global.dist));
});

// gulp-uglify
gulp.task('minify', function() {
  gulp.src(global.js)
    .pipe(uglify())
    .pipe(gulp.dest(global.build));
});

// fileCopy
gulp.task('copy', function () {
  return gulp.src([global.src + '/**/*.*', '!' + global.ejs, '!' + global.less, '!' + global.scss])
    .pipe(gulp.dest(global.dist));
});

// fileCopy
gulp.task('build-copy', ['minify'], function () {
  return gulp.src([global.dist + '/**/*.*', '!./dist/**/*.js'])
    .pipe(gulp.dest(global.build));
});

// Webサーバー
gulp.task('connect', function () {
  gulp.src(global.dist)
    .pipe(webserver({
      fallback: 'index.html',
      livereload: true,
      open: true,
      port: 8080
    }));
});

// browserSync
gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: "./dist/"
    }
  });
});

// watch
gulp.task('watch', ['copy'], function () {
  gulp.watch([global.ejs, global.excludeFile.ejs], ['ejs']);
  gulp.watch([global.scss, global.excludeFile.scss], ['sass']);
  gulp.watch([global.less, global.excludeFile.less], ['less']);
  gulp.watch([global.src + '/**/*.*', global.excludeFile.less, global.excludeFile.ejs], ['copy']);
});

// delete-dist
gulp.task('delete-dist', function (cb) {
  rimraf(global.dist, cb);
});

// delete-build
gulp.task('delete-build', function (cb) {
  rimraf(global.build, cb);
});

// Default
gulp.task('default', function (callback) {
  runSequence(['less', 'sass', 'ejs', 'copy'], 'connect', 'browserSync', 'watch', callback);
});

// build 納品ファイル作成
gulp.task('build', function (callback) {
  runSequence('delete-dist', ['less-build', 'sass-build', 'ejs', 'copy'], 'delete-build', 'build-copy', 'delete-dist', callback);
});

// eslint
gulp.task('lint', function () {
  return gulp.src([global.js])
    .pipe(plumber({
      // エラーをハンドル
      errorHandler: function (error) {
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
