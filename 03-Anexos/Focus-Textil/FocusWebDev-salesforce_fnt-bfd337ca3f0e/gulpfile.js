require('colors')

const gulp = require('gulp');
const HubRegistry = require('gulp-hub');
const browserSync = require('browser-sync');
const conf = require('./conf/gulp.conf');
const replace = require('gulp-replace');
const dotenv = require('dotenv');

const hub = new HubRegistry([conf.path.tasks('*.js')]);
gulp.registry(hub);

if (!process.env.NODE_ENV) {
  console.error(
    'NODE_ENV not set, please create' +
    '.env.ENVIROMENT_NAME file in root folder and set NODE_ENV variable'
    .red
  );

  process.exit(1);
}

dotenv
  .config({
    path: '.env.' + process.env.NODE_ENV
  });

console.log('APP STARTED ON: '.magenta + process.env.NODE_ENV.toString().toUpperCase().green);

const repliceEnvFiles = function (origin = [], destination) {
  console.log('Inject Environments to: '.magenta + process.env.NODE_ENV.toString().green);

  return gulp.src(origin)
    .pipe(replace('process.env.API_URL', JSON.stringify(process.env.API_URL)))
    .pipe(replace('process.env.APP_ENV', JSON.stringify(process.env.APP_ENV)))
    .pipe(replace('process.env.APP_VERSION', JSON.stringify(process.env.APP_VERSION)))
    .pipe(gulp.dest(destination));
}

//   return gulp.src(['dist/**/*.js', 'dist/**/*.js.map'])

gulp.task('inject', gulp.series(gulp.parallel('styles', 'scripts'), 'inject'));
gulp.task('build',
  gulp.series(
    'partials',
    gulp.parallel('inject', 'other'),
    'build',
    function () {
      return repliceEnvFiles(['dist/**/*.js', 'dist/**/*.js.map'], 'dist');
    }
  )
);

gulp.task('serve', function () {
  return gulp.series(
    'partials',
    gulp.parallel('inject', 'watch', 'browsersync'),
    function () {
      return repliceEnvFiles(['src/app/services/**/*.js'], '.tmp/app/services')
    }
  )();
});


gulp.task('default', gulp.series('env'))
gulp.task('default', gulp.series('clean', 'build'));
gulp.task('test', gulp.series('scripts', 'karma:single-run'));
gulp.task('test:auto', gulp.series('watch', 'karma:auto-run'));
gulp.task('serve:dist', gulp.series('default', 'browsersync:dist'));
gulp.task('default', gulp.series('clean', 'build'));

const replaceEnvWatch = () => repliceEnvFiles(['src/app/services/**/*.js'], '.tmp/app/services')

gulp.task('replaceEnv', replaceEnvWatch);
gulp.task('watch', watch);
function reloadBrowserSync(cb) {
  browserSync.reload();
  cb();
}


function watch(done) {
  gulp.watch([
    conf.path.src('index.html'),
    'bower.json'
  ], gulp.parallel('inject'));
  gulp.watch(conf.path.src('app/**/*.html'), gulp.series('partials', reloadBrowserSync));
  gulp.watch([
    conf.path.src('**/*.less'),
    conf.path.src('**/*.css')
  ], gulp.series('styles'));
  gulp.watch(conf.path.src('**/*.js'), gulp.series('inject'));
  gulp.watch(conf.path.src('**/*.js'), gulp.series('inject', 'replaceEnv', reloadBrowserSync));

  done();
}
