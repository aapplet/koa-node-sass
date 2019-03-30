declare function middleware({ src, css, init, gzip, force, maxAge, extname, browsers, sourceMap, prefix, plugins, sass, log }: {
    src: string;
    css?: string;
    init?: boolean;
    gzip?: boolean;
    force?: boolean;
    maxAge?: number;
    extname?: '.sass' | '.scss';
    browsers?: string | string[];
    sourceMap?: boolean;
    prefix?: string;
    plugins?: object;
    sass?: object;
    log?: (ctx?: any, logs?: any, err?: any) => void;
}): (ctx?: any, next?: any) => Promise<any>;
export default middleware;
