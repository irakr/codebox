#! /usr/bin/env node

var _ = require("lodash");
var path = require("path");
var program = require('commander');
var open = require("open");
var Gittle = require('gittle');

var pkg = require("../package.json");
var codebox = require("../lib");

program
.version(pkg.version)
.option('-r, --root [path]', 'Root folder for the workspace, default is current directory', "./")
.option('-t, --templates [list]', 'Configuration templates, separated by commas', "")
.option('-p, --port [port]', 'HTTP port', 3000)
.option('-o, --open', 'Open the IDE in your favorite browser')
.option('-e, --email [email address]', 'Email address to use as a default authentication')
.option('-u, --users [list users]', 'List of coma seperated users and password (formatted as "username:password")');


program.on('--help', function(){
    console.log('  Examples:');
    console.log('');
    console.log('    $ codebox --root=./myfolder');
    console.log('');
});

program.parse(process.argv);

// Parse auth users
var users = !program.users ? {} : _.object(_.map(program.users.split(','), function(x) {
    // x === 'username:password'
    return x.split(':', 2);
}));

// Generate configration
var options = {
    root: path.resolve(process.cwd(), program.root),
    port: program.port,
    auth: {
        users: users
    }
};


codebox.start(options)
.then(function() {
    if (program.email) return program.email;

    // Codebox git repo: use to identify the user
    var repo = new Gittle(path.resolve(__dirname, ".."));
    return repo.identity()
    .get("email")
    .fail(function() {
        return "";
    });
})
.then(function(email) {
    var token = users[email] || Math.random().toString(36).substring(7);
    var url = "http://localhost:"+program.port+"/auth?email="+email+"&token="+token;

    console.log("\nCodebox is running at", url);

    if (program.open) open(url);
})
.fail(function(err) {
    console.log(err.stack || err.message || err);
});
