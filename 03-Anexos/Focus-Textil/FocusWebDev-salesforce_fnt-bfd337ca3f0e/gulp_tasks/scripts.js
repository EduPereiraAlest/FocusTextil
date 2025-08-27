const gulp = require('gulp');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');

const conf = require('../conf/gulp.conf');

gulp.task('scripts', scripts);

function scripts() {
  return (
    gulp
      .src(conf.path.src('**/**/*.js'))
      .pipe(eslint())
      .pipe(
        babel({
          presets: ['env'],
          plugins: [
            'transform-class-properties',
            'transform-object-rest-spread'
          ]
        })
      )

      // .pipe(eslint.format())

      .pipe(gulp.dest(conf.path.tmp()))
  );
}
