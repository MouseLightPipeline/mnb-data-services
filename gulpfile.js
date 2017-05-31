"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var gulp = require("gulp");
var shell = require("gulp-shell");
var contents = fs.readFileSync("./package.json").toString();
var npmPackage = JSON.parse(contents);
var version = npmPackage.version;
var repo = npmPackage.dockerRepository;
var imageName = npmPackage.dockerImageName || npmPackage.name;
var dockerRepoImage = repo + "/" + imageName;
var imageWithVersion = dockerRepoImage + ":" + version;
var imageAsLatest = dockerRepoImage + ":latest";
var buildCommand = "docker build --tag " + imageWithVersion + " .";
var tagCommand = "docker tag " + imageWithVersion + " " + imageAsLatest;
var pushCommand = "docker push " + imageWithVersion;
var pushLatestCommand = "docker push " + imageAsLatest;
gulp.task("default", ["docker-build"]);
gulp.task("release", ["docker-push"]);
gulp.task("docker-build", shell.task([
    buildCommand,
    tagCommand
]));
gulp.task("docker-push", ["docker-build"], shell.task([
    pushCommand,
    pushLatestCommand
]));
