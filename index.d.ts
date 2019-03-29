declare function middleware({src, css, gzip, force, maxAge, extname, browsers, sourceMap, prefix, plugins, sass, log}: {
    src?: any;
    css?: any;
    gzip?: any;
    force?: any;
    maxAge?: any;
    extname?: any;
    browsers?: any;
    sourceMap?: any;
    prefix?: any;
    plugins?: any;
    sass?: any;
    log?: any;
}): (ctx?: any, next?: any) => Promise<any>;

export default middleware