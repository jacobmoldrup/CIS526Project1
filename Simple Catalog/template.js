/** @module template
 */
module.exports = {
    render: render,
    loadDir: loadDir
}

var fs = require('fs');
var templates = {};

/**
 * @function loadDir
 * loads a directory of templates
 * @param {string} directory - the directory to loadDir
 */
function loadDir(directory){
    var dir = fs.readdirSync(directory);
    dir.forEach(function(file){
        var path = directory + '/' + file;
        var stats = fs.statSync(path);
        if(stats.isFile()){
            templates[file] = fs.readFileSync(path).toString();
        }
    });
}


/**
 * @function renderredners a template with ebedded javascript
 * @param {string} templateName - the template to render.
 * @param {}
 */
function render(templateName, context){
    return templates[templateName].replace(/{{(.+)}}/g, function(match, js){
       return eval("var context = " + JSON.stringify(context) + ";" + js);
    });
}