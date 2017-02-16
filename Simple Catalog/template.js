/** @module template
 */
module.exports = {
    render: render
}

var fs = require('fs');


/**
 * @function renderredners a template with ebedded javascript
 * @param {string} templateName - the template to render.
 * @param {}
 */
function render(templateName, context){
    var html = fs.readFileSync('templates/' + templateName + '.html');
    html = html.toString().replace(/{{(.+)}}/g, function(match, js){
       return eval("var context = " + JSON.stringify(context) + ";" + js);
    });

    return html;
}