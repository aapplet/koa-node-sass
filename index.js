"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const sass = require('sass');
const postcss = require('postcss');
const autoPrefix = require('autoprefixer');
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
// default options
const opts = {
    srcPath: '',
    cssPath: '',
    maxAge: 0,
    gzip: false,
    force: false,
    sourceMap: false,
    urlPrefix: '/',
    extname: '.scss',
    browsers: ['last 2 versions', '> 2%'],
    plugins: [],
    sass: sass,
};
function middleware({ src, css, init, gzip, force, maxAge, extname, browsers, sourceMap, prefix, plugins, sass, log }) {
    if (!src || !isString(src)) {
        throw new Error('[koa-node-sass]: required src');
    }
    if (prefix && !isString(prefix)) {
        throw new Error('[koa-node-sass]: prefix is string');
    }
    if (extname && !/^\.s[c|a]ss$/.test(extname)) {
        throw new Error(`[koa-node-sass]: The extname is '.scss' or '.sass'`);
    }
    opts.srcPath = path.resolve(src || '');
    opts.cssPath = css || opts.srcPath;
    opts.gzip = gzip || opts.gzip;
    opts.sass = sass || opts.sass;
    opts.force = force || opts.force;
    opts.maxAge = maxAge || opts.maxAge;
    opts.extname = extname || opts.extname;
    opts.browsers = browsers || opts.browsers;
    opts.sourceMap = sourceMap || opts.sourceMap;
    opts.urlPrefix = path.join('/', prefix || '');
    opts.plugins = plugins || autoPrefix({ browsers: opts.browsers });
    if (init) {
        fileSearch(opts.srcPath);
    }
    const logs = { srcFile: '', cssFile: '', options: opts };
    if (log) {
        log(null, logs);
    }
    return async (ctx, next) => {
        try {
            if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
                return next();
            }
            if (!/\.css$/.test(ctx.url)) {
                return next();
            }
            const url = path.relative(opts.urlPrefix, ctx.url);
            const srcFile = path.join(opts.srcPath, url.replace(/\.css$/, opts.extname));
            const cssFile = path.join(opts.cssPath, url);
            if (log) {
                logs.srcFile = srcFile;
                logs.cssFile = cssFile;
                log(ctx, logs);
            }
            const result = await compare(srcFile, cssFile);
            if (!result) {
                return next();
            }
            // Compile srcFile to cssFile
            const content = await compile(srcFile, cssFile);
            ctx.set('Content-Type', 'text/css;charset=utf-8');
            ctx.set('Cache-Control', 'max-age=' + opts.maxAge);
            // gzip compression
            if (opts.gzip) {
                ctx.set('Content-Encoding', 'gzip');
                const gzip = ctx.body = zlib.createGzip({ level: 9 });
                gzip.pipe(fs.createWriteStream(cssFile + '.gz'));
                gzip.end(content);
            }
            else {
                ctx.body = content;
            }
        }
        catch (e) {
            if (log)
                log(ctx, logs, e);
            return next();
        }
    };
}
// Determine if srcFile is up to date
async function compare(srcFile, cssFile) {
    const [srcStat, cssStat] = await Promise.all([
        stat(srcFile).catch(() => false),
        stat(cssFile).catch(() => false),
    ]);
    const srcMtime = srcStat.mtimeMs;
    const cssMtime = cssStat.mtimeMs;
    // no src
    if (!srcMtime) {
        throw new Error('[koa-node-sass]:sass source file not found');
    }
    // Always recompile
    if (opts.force) {
        return true;
    }
    // exist src , no css
    if (!cssMtime) {
        return true;
    }
    // exist src , exist css => src mtime > css mtime
    return srcMtime > cssMtime;
}
async function compile(srcFile, cssFile) {
    // Create if the directory does not exist
    mkdirSync(path.dirname(cssFile));
    const options = {
        // read path
        file: srcFile,
        // write path
        outFile: cssFile,
        // compress
        outputStyle: 'compressed',
        // enable create map
        sourceMap: opts.sourceMap,
        // embeds the source map as a data URI
        sourceMapEmbed: opts.sourceMap,
    };
    // sass compile
    const source = opts.sass.renderSync(options);
    // create *.css.map file
    if (source.map) {
        fs.writeFile(cssFile + '.map', source.map, () => true);
    }
    // postcss compile
    const content = postcss(opts.plugins).process(source.css, { from: undefined }).content;
    // create *.css file
    fs.writeFile(cssFile, content, () => true);
    return content;
}
// search and compile files
function fileSearch(dirPath) {
    readdir(dirPath).then(files => {
        files.forEach(fileName => {
            const srcPath = path.join(dirPath, fileName);
            stat(srcPath).then(stats => {
                if (stats.isDirectory())
                    return fileSearch(srcPath);
                if (!/\.s[a|c]ss$/.test(fileName))
                    return;
                let relative = path.relative(opts.srcPath, srcPath);
                let cssPath = path.join(opts.cssPath, relative.replace(/\.s[a|c]ss$/, '.css'));
                compile(srcPath, cssPath).then(content => {
                    if (!opts.gzip)
                        return;
                    const gzip = zlib.createGzip({ level: 9 });
                    gzip.pipe(fs.createWriteStream(cssPath + '.gz'));
                    gzip.end(content);
                });
            });
        });
    });
}
function isString(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
}
// create dir
function mkdirSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    else {
        if (mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
exports.default = middleware;
