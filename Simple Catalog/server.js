/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
 */
"use strict;"

/* global variables */
var multipart = require('./multipart');
var template = require('./template');
var http = require('http');
var url = require('url');
var fs = require('fs');
var port = 9596;

/* load cached files */
//var config = JSON.parse(fs.readFileSync('config.json'));
//var stylesheet = fs.readFileSync('gallery.css');

var stylesheet = fs.readFileSync('public/styles/shared.css');


// load templates
template.loadDir('views');

/* Create and launch the webserver */
var server = http.createServer(handleRequest);
server.listen(port, function(){
  console.log("Server is listening on port ", port);
});


/** @function handleRequest
 * A function to determine what to do with
 * incoming http requests.
 * @param {http.incomingRequest} req - the incoming request object
 * @param {http.serverResponse} res - the response object
 */
function handleRequest(req, res) {
  // at most, the url should have two parts -
  // a resource and a querystring separated by a ?
  var urlParts = url.parse(req.url);

  // if(urlParts.query){
  //   var matches = /title=(.+)($|&)/.exec(urlParts.query);
  //   if(matches && matches[1]){
  //     config.title = decodeURIComponent(matches[1]);
  //     fs.writeFile('config.json', JSON.stringify(config));
  //   }
  // }

  switch(urlParts.pathname) {
    case '/':
    case '/views':
    case 'index':
    case '/index':
    case 'index.html':
    case '/index.html':
        serveAllTeams(req, res);
      break;
    case 'add-new-form.html':
    case '/add-new-form.html':
    case 'add-new-form':
    case '/add-new-form':
      console.log('in case for new team.' + req.url);
      serveForm(req, res);
      break;
    case 'public/styles/shared.css': // **********why does this exist
      res.setHeader('Content-Type', 'text/css');
      res.end(stylesheet);
      break;
    default:
      //serveTeam(req.url, req, res);
      serveImage(req.url, req, res);

  }
}


/** @function serveAllTeams
 * A function to serve a HTML page representing a
 * gallery of images.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveAllTeams(req, res) {
  getTeamNames(function(err, teamNames){
    if(err) {
      console.error(err);
      res.statusCode = 500;
      res.statusMessage = 'Server error';
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(buildIndexPage(teamNames));
  });
}

function serveForm(req, res){
  res.setHeader('Context-Type', 'text/html');
  res.end(buildNewTeamPage());
}

/** @function serveImage
 * A function to serve an image file.
 * @param {string} filename - the filename of the image
 * to serve.
 * @param {http.incomingRequest} - the request object
 * @param {http.serverResponse} - the response object
 */
function serveImage(fileName, req, res) {
  fs.readFile('images/' + decodeURIComponent(fileName), function(err, data){
    if(err) {
      console.error(err);
      res.statusCode = 404;
      res.statusMessage = "Resource not found";
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'image/*');
    res.end(data);
  });
}



function buildNewTeamPage(req, res){
  return template.render('add-new-form.html','');
}

/** @function getTeamNames
 * Retrieves the filenames for all images in the
 * /images directory and supplies them to the callback.
 * @param {function} callback - function that takes an
 * error and array of filenames as parameters
 */
function getTeamNames(callback) {
  fs.readdir('public/images/', function(err, fileNames){
    if(err){
      callback(err, undefined);
    } 
    else{
      callback(false, fileNames);
    }
  });
}

/**
 * @function buildIndexPage
 * A helper function to build an HTML string
 * of a gallery webpage.
 * @param {string[]} imageTags - the HTML for the individual
 * gallery images.
 */
function buildIndexPage(imageTags) {
  return template.render('index.html', {
    imageTags: teamNamesToHTMLTags(imageTags).join('')
  });
}


/** @function imageNamesToTags
 * Helper function that takes an array of image
 * filenames, and returns an array of HTML img
 * tags build using those names.
 * @param {string[]} filenames - the image filenames
 * @return {string[]} an array of HTML img tags
 */
function teamNamesToHTMLTags(fileNames) {
  return fileNames.map(function(fileName) {
    return `<a href="${fileName.split('.')[0]}"><img src="${fileName}" alt="${fileName}"></a>`;
  });
}



// // ************************************is this function being built correctly?
// /** @function serveImage
//  * A function to serve an image file.
//  * @param {string} filename - the filename of the image
//  * to serve.
//  * @param {http.incomingRequest} - the request object
//  * @param {http.serverResponse} - the response object
//  */
// function serveTeam(fileName, req, res) {
//   console.log('In ServeTeam: FileName = ' + fileName);
//   res.setHeader('Content-Type', 'text/html');
//   res.end(buildTeamPage('images/'+ fileName));
// }

// function buildTeamPage(fileName){
//     // get the data from json object based on filename.*********
//     return template.render('team-data.html', {
//     imageTag: teamNameToHTMLTag(fileName),
//     name: '',
//     description: '',
//     coach:'',
//     record:'',
//     location:''
//   });

// }

// function teamNameToHTMLTag(fileName){
//   return `<img src="${fileName}" alt="${fileName}">`;
// }


/** @function uploadImage
 * A function to process an http POST request
 * containing an image to add to the gallery.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function uploadImage(req, res) {
  multipart(req, res, function(req, res) {
    // make sure an image was uploaded
    if(!req.body.image.filename) {
      console.error("No file in upload");
      res.statusCode = 400;
      res.statusMessage = "No file specified"
      res.end("No file specified");
      return;
    }
    
    fs.writeFile('images/' + req.body.image.filename, req.body.image.data, function(err){
      if(err) {
        console.error(err);
        res.statusCode = 500;
        res.statusMessage = "Server Error";
        res.end("Server Error");
        return;
      }
      serveGallery(req, res);
    });
  });
}



