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

var sharedStylesheet = fs.readFileSync('public/styles/shared.css');
var indexStylesheet = fs.readFileSync('public/styles/index.css');


// load templates
template.loadDir('views');

var jsonFiles = {};
loadDir('public/Data');

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

  switch(urlParts.pathname) {
    case '/':
    case '/views':
    case '/index':
    case '/index.html':
      serveAllTeams(req, res);
      break;
    case '/add-new-form.html':
    case '/add-new-form':
    if(req.method == 'GET') {
        serveForm(req, res);
      } else if(req.method == 'POST') {
        uploadData(req, res);
      }
      break;
    case '/public/styles/index.css': 
      res.setHeader('Content-Type', 'text/css');
      res.end(indexStylesheet);
      break;
    case '/public/styles/shared.css':
      res.setHeader('Content-Type', 'text/css');
      res.end(sharedStylesheet);
      break;
    default:
      if(req.url.split('/')[1] == 'team'){
        serveTeam(req.url.split('/')[2], req, res);
      }
      else{
        serveImage(req.url, req, res);
      }
  }
}


/** @function serveAllTeams
 * A function to serve a HTML page representing a
 * gallery of images.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveAllTeams(req, res) {
  getTeamImages(function(err, teamNames){
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
function getTeamImages(callback) {
  fs.readdir('public/images/', function(err, fileNames){
    if(err){
      callback(err, undefined);
    } 
    else{
      callback(false, fileNames);
    }
  });
}

/** @function getTeamNames
 * Retrieves the filenames for all images in the
 * /images directory and supplies them to the callback.
 * @param {function} callback - function that takes an
 * error and array of filenames as parameters
 */
function getTeamJSON(callback) {
  fs.readdir('public/Data/', function(err, fileNames){
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
    return `<a href="${'team/' + fileName.split('.')[0]}"><img src="${fileName}" alt="${fileName}"></a>`;
  });
}



/** @function serveImage
 * A function to serve an image file.
 * @param {string} filename - the filename of the image
 * to serve.
 * @param {http.incomingRequest} - the request object
 * @param {http.serverResponse} - the response object
 */
function serveTeam(fileName, req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.end(buildTeamPage( fileName ));
}

function buildTeamPage(fileName){
    // get the data from json object based on filename.
    // make reading of file asyncronous.
    var data = jsonFiles[fileName];
    return template.render('team-data.html', {
      imageTag: teamNameToHTMLTag(data.imagePath),
      name: data.name,
      description: data.description,
      coach:data.coach,
      record:data.record,
      location:data.location
    });

}

function teamNameToHTMLTag(teamLogo){
  return `<img src="${teamLogo}" alt="NFL Team Logo">`;
}


function uploadData(req, res){
  multipart(req, res, function(){
    var jsonData ={
      name:req.body.team,
      coach:req.body.coach,
      description:req.body.description,
      location:req.body.location,
      record:req.body.record,
      imagePath: req.body.image.filename
    }
    uploadImage(req, res);
    var jsonFileName = req.body.image.filename.split('.')[0];
    var jsonExtension = '.json';
    fs.writeFile(jsonFileName + jsonExtension, jsonData);
    jsonData[jsonFileName] = jsonData;

  });
}

/** @function uploadImage
 * A function to process an http POST request
 * containing an image to add to the gallery.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function uploadImage(req, res) { 
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
}

function loadDir(directory){
    var dir = fs.readdirSync(directory);
    dir.forEach(function(file){
        var path = directory + '/' + file;
        var stats = fs.statSync(path);
        if(stats.isFile()){
            jsonFiles[file.split('.')[0]] = JSON.parse(fs.readFileSync(path).toString());
        }
    });
}



