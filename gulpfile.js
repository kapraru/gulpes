import gulp from 'gulp';
import sync from 'browser-sync';
import postcss from 'gulp-postcss';
import fileinclude from 'gulp-file-include';
import gulpif from 'gulp-if';
import terser from 'gulp-terser';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import {deleteAsync as del} from 'del';
import sourcemaps from 'gulp-sourcemaps';

// image processing
import tinypng from 'gulp-tinypng-compress';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import webp from 'imagemin-webp';
import svgo from 'imagemin-svgo';

// postcss plugins
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import pimport from 'postcss-import';
import postcssVars from 'postcss-simple-vars';

const {src, dest, series, parallel} = gulp;
const dist = '../assets';
const TEST = 'test';
// styles
const styles = () => {
  const plugins = [
    pimport,
    postcssVars,
    nested,
    autoprefixer({cascade: true}),
    cssnano({
      preset: ['default', {
        mergeLonghand: false,
      }]
    }),
  ];
  return src(['src/styles/**/*.css', "!src/styles/**/_*.css", "!src/styles/libs/**/*.css"])
    .pipe(postcss(plugins))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${dist}/styles`))
    .pipe(sync.stream());
}

// styles libs
const stylesLibs = () => {
  return src('src/styles/libs/**/*.css')
    .pipe(postcss([pimport]))
    .pipe(dest(`${dist}/styles/libs`))
    .pipe(sync.stream());
}

// scripts
const scripts = () => {
  return src(['src/scripts/**/*.js', '!src/scripts/libs/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(fileinclude())
    .pipe(babel({
        presets: ['@babel/preset-env']
      }))
    .pipe(terser())
    .pipe(sourcemaps.write())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${dist}/scripts`))
    .pipe(sync.stream());
}

// scripts libs
const scriptsLibs = () => {
  return src('src/scripts/libs/**/*.js')
    .pipe(fileinclude())
    .pipe(dest(`${dist}/scripts/libs`))
    .pipe(sync.stream());
}

// images
const images = () => {
  const isPng = /\.png$/;
  const isJpg = /\.jpg$|\.jpeg$/;
  const all = /\.png$|\.jpg$|\.jpeg$/;

  return src('src/images/**/*')

    // compress png and jpeg
    .pipe(gulpif(isPng, imagemin([
      pngquant({
        quality: [0.6, 0.8],
        speed: 1,
        dithering: 0.6
      })
    ])))
    .pipe(gulpif(isJpg, imagemin([
      mozjpeg({
        quality: 85,
        progressive: true
      })
    ])))
    .pipe(dest(`${dist}/images`))

    // convert png and jpg to webp
    .pipe(src('src/images/**/*'))
    .pipe(gulpif(all, imagemin([
      webp({
        quality: 85,
        method: 6
      })
    ])))
    .pipe(gulpif(all, rename({ extname: '.webp' })))

    // .pipe(
    //   tinypng({
    //     key: '',
    //     sigFile: 'images/.tinypng-sigs',
    //     log: true
    //   })
    // )
    .pipe(dest(`${dist}/images`));
}

// fonts
const fonts = () => {
  return src('src/fonts/**/*')
    .pipe(dest(`${dist}/fonts`))
    .pipe(sync.stream());
}

// media
const media = () => {
  return src('src/media/**/*')
    .pipe(dest(`${dist}/media`))
    .pipe(sync.stream());
}

// watch
const watch = () => {
  gulp.watch('src/styles/**/*.css', series(styles));
  gulp.watch('src/scripts/**/*.js', series(scripts));
  gulp.watch('src/images/**/*', series(images));
  gulp.watch('src/fonts/**/*', series(fonts));
  gulp.watch('src/media/**/*', series(media));
};

// // server
const server = () => {
  sync.init({
    ui: false,
    notify: false,
    server: {
      baseDir: `${dist}`
    }
  });
};

// clean
const clean = () => {
  return del(`./${dist}/`, {
    force: true
  });
}

// export
export default series(
  clean,
  parallel(
    styles,
    scripts,
    scriptsLibs,
    stylesLibs,
    images,
    fonts,
    media
  ),
  parallel(
    watch,
    server
  ),
);