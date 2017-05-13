/**
 * Created by keary on 5/13/17.
 */
"use strict";
var commander     = require('commander');

let net = require('net');
let dgram = require('dgram');

commander._allowUnknownOption = true;
commander
    .option('-p, --port <port>', 'HTTP server port [8042]', Number, 8042)
    .option('-b, --bind <bind>', 'Bind to IP address for torrent')
    .option('-l, --listen <listen>', 'Bind to IP address for http server')
    .parse(process.argv);



let socket_connect = net.Socket.prototype.connect;
let server_listen = net.Server.prototype.listen;
let socket_bind = dgram.Socket.prototype.bind;

function isPipeName(s) {
    return typeof s === 'string' && toNumber(s) === false;
}

function normalizeArgs(args) {
    if (args.length === 0) {
        return [{}, null];
    }

    const arg0 = args[0];
    var options = {};
    if (typeof arg0 === 'object' && arg0 !== null) {
        // (options[...][, cb])
        options = arg0;
    } else if (isPipeName(arg0)) {
        // (path[...][, cb])
        options.path = arg0;
    } else {
        // ([port][, host][...][, cb])
        options.port = arg0;
        if (args.length > 1 && typeof args[1] === 'string') {
            options.host = args[1];
        }
    }

    var cb = args[args.length - 1];
    if (typeof cb !== 'function')
        return [options, null];
    else
        return [options, cb];
}

net.Socket.prototype.connect = function() {
    let normalized;
    if (arguments.length === 1 && Array.isArray(arguments[0])) {
        normalized = arguments[0];
    } else {
        normalized = normalizeArgs(Array.prototype.slice.call(arguments));
    }
    let options = normalized[0];
    let cb = normalized[1];

    //console.log('connect', options);
    if (commander.bind) {
        options.localAddress = commander.bind;
    }
    //console.log('modified connect', options);
    return socket_connect.apply(this, Array.prototype.slice.call(arguments));
};

net.Server.prototype.listen = function() {

    let normalized;
    if (arguments.length === 1 && Array.isArray(arguments[0])) {
        normalized = arguments[0];
    } else {
        normalized = normalizeArgs(Array.prototype.slice.call(arguments));
    }
    let options = normalized[0];
    let cb = normalized[1];

    //console.log('listen', options);
    if (commander.listen && options.port == commander.port) {
        options.host = commander.listen;
    } else if (commander.bind && options.port != commander.port) {
        options.host = commander.bind;
    }
    //console.log('modified listen', options);
    return server_listen.call(this, options, cb);
};

dgram.Socket.prototype.bind = function(port, address, cb) {
    //console.log("sock bind addr:", address);
    if (commander.bind) {
        address = commander.bind;
    }
    //console.log("sock bind modified addr:", address);
    return socket_bind.call(this, port, address, cb);
};



let scrapmagnet = require('./scrapmagnet.js');