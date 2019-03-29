## Installation

```
$ npm install koa-node-scss
```

## Example

```javascript
// D:\WorkSpace\template\app.js

const koa = require('koa');
const serve = require('koa-static');
const nodeSass = require('node-sass');
const autoprefixer = require('autoprefixer')
const sass = require('koa-node-sass').default;

const app = koa();

/**
* e.g:
*   common:
*       projectPath = 'D:\WorkSpace\template'
*       ctx.url     = '/css/index.css'
*   No.1:
*       prefix      = '/css'
*       srcFile     = 'D:\WorkSpace\template\static\scss\index.scss'
*       cssFile     = 'D:\WorkSpace\template\public\css\index.css'
*   No.2:
*       prefix      = '/'
*       srcFile     = 'D:\WorkSpace\template\static\scss\css\index.scss'
*       cssFile     = 'D:\WorkSpace\template\public\css\css\index.css'
*/
app.use(sass({
    src: path.join(__dirname, 'static', 'scss'), // default __dirname - sass Source File
    css: path.join(__dirname, 'public', 'css'),  // default srcPath   - css Output directory
    maxAge: 0,                                   // default 0         - Cache time, unit second
    gzip: true,                                  // default false     - enable gzip compression
    force: true,                                 // default false     - Always recompile
    prefix: '/css',                              // default '/'       - The URL prefix of the request is ignored when splicing paths
    extname: '.scss',                            // default '.scss'   - source file extname. '.sass' or '.scss'
    sourceMap: true,                             // default false     - enable map
    browsers: ['last 2 versions', '> 2%'],       // default PostCSS Plugin autoprefixer browsers config
    sass: nodeSass,                              // default Dart Sass - Override the default parser as node-sass
    plugins: [                                   // PostCSS plugins. Override browsers option and default plugin autoprefixer
        autoprefixer({browsers: ['last 2 versions', '> 2%']})
    ],
    log: (ctx, logs, err) => {
        console.log(ctx.url)
        console.log(logs)
        console.log(err)
    }
}));

app.use(serve('static'));

app.listen(3000);
```