const npm = require('npm');
const path = require('path');
const https = require('https');
const fs = require('fs-extra');
const bp = require('body-parser');
const ytdl = require('ytdl-core');
const express = require('express');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');
const ffmetadata = require("ffmetadata");
const childProcess = require("child_process");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const app = express();
const port = 818;

var plexVideoFolder = ''; // FULL PATH to Plex Video content folder
var plexMusicFolder = ''; // FULL PATH to Plex Audio content folder
var enableLogging = '0'; // 1 or 0 - Easy Logging for making reports on the github

var convertedVideos = path.join(__dirname, 'converted', 'videos/');
var convertedAudio = path.join(__dirname, 'converted', 'audio/');
var convertedFolder = path.join(__dirname, 'converted');


app.use(bp.json())
app.use(bp.urlencoded({
  extended: true
}))

app.post('/download', async function(req, res) {

  const youtube = req.body.link + "";
  const filetype = req.body.type + "";

  var youtubelink = "";
  await changeURL();

  const info = await ytdl.getInfo(youtubelink);
  const videoID = `${info.videoDetails.videoId}`;
  const title = `${info.videoDetails.title}`;
  const description = `${info.videoDetails.description}`;
  const author = `${info.videoDetails.author.name}`;
  var thumbnail = '';

  var fixedtitle = '';
  await fixTitle();

  var thumbnaillink = "";
  await thumbnailCheck();

  if (enableLogging === "1") {
    console.log(' ');
    console.log('=============');
    console.log(req.body);
    console.log('Entered link: ' + youtubelink);
    console.log('Filetype: ' + filetype);
    console.log('Fixed File Title: ' + fixedtitle);
    console.log(' ');
    console.log('--- Video Info: ---');
    console.log('VideoID: ' + videoID)
    console.log('Author: ' + author)
    console.log('Video Title: ' + title)
    console.log('Description: ' + description)
    console.log(' ');
    console.log('--- raw info dump --- ');
    console.log(info);
    console.log(' ');
    console.log('=============');
    console.log(' ');
  };

  if (filetype === "mp3") {

    ytdl(youtubelink, {
        filter: 'audioonly',
        quality: 'highestaudio'
      })
      .pipe(fs.createWriteStream(`${fixedtitle}.mp3`))
      .on('progress', function(progress) {
        console.log('Conversion: ' + Math.round(100 * progress.percent) / 100 + '% done');
      })
      .on('end', function(err) {
        if (!err)
          console.log(`=======\n${info.videoDetails.title} Audio downloaded successfully\n=======\n`);
      })

    setTimeout(moveMP3, 15000);

    function moveMP3() {
      fs.move(`${fixedtitle}.mp3`, convertedAudio, err => {
        if (err) return console.error(err)
        console.log(`======\n${info.videoDetails.title}.mp3 downloaded successfully!\n=======\n`)
      })
    };
  };

  if (filetype === "mp4") {
    console.log("starting download of " + title + '\n');
    ytdl(youtubelink, {
      quality: 'highestvideo'
    }).pipe(fs.createWriteStream(`${fixedtitle}.mp4`));

    ytdl(youtubelink, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).pipe(fs.createWriteStream(`${fixedtitle}.mp3`));

    setTimeout(runffmpeg, 15000);

    function runffmpeg() {
      console.log("ffmpeg function called");
      console.log('Fixed File Title: ' + fixedtitle);
      let newFfmpeg = new ffmpeg(`${fixedtitle}.mp4`);
      newFfmpeg.setFfmpegPath(ffmpegPath)
      newFfmpeg.addInput(`${fixedtitle}.mp3`)
      newFfmpeg.output(convertedVideos + `${fixedtitle} [${info.videoDetails.author.name}].mp4`)
      newFfmpeg.on('progress', function(progress) {
        console.log('Combinding Files: ' + Math.round(100 * progress.percent) / 100 + '% done');
      })
      newFfmpeg.on('end', function(err) {
        if (!err)
          console.log(`=======\n${info.videoDetails.title} Converted Successfully\n`);
        // Code to Delete only audio MP3
        fs.unlink(fixedtitle + `.mp3`, function(err) {
          if (err) throw err;
          if (enableLogging === "1") {
            console.log('Temp MP3 deleted!');
          }
        });
        // Code to Delete MP4 with no audio
        fs.unlink(fixedtitle + `.mp4`, function(err) {
          if (err) throw err;
          if (enableLogging === "1") {
            console.log('Temp MP4 deleted!');
          }
        });
        console.log(`=======\n`);

        var data = {
          author: `${info.videoDetails.author.name}`,
          title: title,
          description: description,
          attachments: ["thumbnail.jpeg"],
        };
        ffmetadata.write(convertedVideos + fixedtitle + ` | [${info.videoDetails.author.name}].mp4`, data, function(err) {
          if (err) console.error("Error writing metadata", err);
          else console.log("Data written");
          fs.unlink(`thumbnail.jpeg`, function(err) {
            if (err) throw err;
            if (enableLogging === "1") {
              console.log('Temp Thumbnail deleted!');
            }
          });
        });
      })
      newFfmpeg.on('error', function(err) {
        console.log('error: ' + err);
      })
      newFfmpeg.run();
    };
  } else {
    // catch error if unchecked
  };

  function fixTitle() {
    var currentTitle = `${info.videoDetails.title}`;
    const regex = /[<>:"-/\|?*]/gi;
    fixedtitle = currentTitle.replace(regex, '');
  };

  function thumbnailCheck() {
    let thumbnaillink = `https://img.youtube.com/vi/` + videoID + `/maxresdefault.jpg`;
    var file = fs.createWriteStream('thumbnail.jpeg');

    var request = https.get(thumbnaillink, function(response) {
      response.pipe(file);
      file.on('finish', function() {});
    })
  };

  function changeURL() {
    var urlcheck = youtube;
    let regex = /youtube.com\/watch.v=.........../g;
    let regexlink = urlcheck.match(regex);
    youtubelink = "https://www." + regexlink;
  };

  res.redirect(301, 'panel');
});

app.get('/MoveMP3s', function(req, res) {

  fs.move(convertedVideos, plexMusicFolder, err => {
    if (err) return console.error(err)
    console.log('======\nMP3s moved successfully!\n=======\n')
  })

  res.redirect(301, 'panel');
});

app.get('/MoveMP4s', function(req, res) {

  fs.move(convertedVideos, plexVideoFolder, err => {
    if (err) return console.error(err)
    console.log('======\nMP4s moved successfully!\n=======\n')
  })

  res.redirect(301, 'panel');
});

app.use('/panel', express.static(path.join(__dirname, 'panel')));

app.listen(port, () => {
  console.log(`=======\nYouTube2Plex now active on http://localhost:${port}/panel/ \n=======\n`)
});

// checks for afew required folders and makes them if they dont already exist
if (!fs.existsSync(convertedFolder)) {
  fs.mkdirSync(convertedFolder);
  fs.mkdirSync(convertedVideos);
  fs.mkdirSync(convertedAudio);
}

updateCheck();

async function updateCheck() {
  let remoteUrl = 'https://raw.githubusercontent.com/mixerrules/YouTube2Plex/main/package.json';
  let remotePackage = await fetch(remoteUrl);
  let remotePackageJson = await remotePackage.json(); // read response body and parse as JSON
  const localPackageJson = require('./package.json');

  if (enableLogging === "1") {
    console.log(remotePackageJson.version + " remote version");
    console.log(localPackageJson.version + " local version");
  }

  if (localPackageJson.version = remotePackageJson.version) {
    if (enableLogging === "1") {
      console.log("=======\nYou are running the current version of YouTube2Plex!\n=======\n")
    }
  }
  if (localPackageJson.version > remotePackageJson.version) {
    if (enableLogging === "1") {
      console.log("=======\nYou are running an unreleased version!\n=======\n")
    }
  }
  if (localPackageJson.version < remotePackageJson.version) {
    console.log("=======\nYou are running version " + localPackageJson.version + " which is outdated! We will auto update for you! \n=======\n")


    // get package.json file from gethub
    https.get("https://raw.githubusercontent.com/mixerrules/YouTube2Plex/main/package-lock .json", (res) => {
      const path = `${__dirname}/package-lock.json`;
      const filePath = fs.createWriteStream(path);
      res.pipe(filePath);
      filePath.on('finish', () => {
        filePath.close();
        console.log('package-lock.json updated.');
      })
    })

    // get package.json file from gethub
    https.get("https://raw.githubusercontent.com/mixerrules/YouTube2Plex/main/package.json", (res) => {
      const path = `${__dirname}/package.json`;
      const filePath = fs.createWriteStream(path);
      res.pipe(filePath);
      filePath.on('finish', () => {
        filePath.close();
        console.log('package.json updated.');
      })
    })

    // Get YT2P JS file from github
    https.get("https://raw.githubusercontent.com/mixerrules/YouTube2Plex/main/YouTube2Plex.js", (res) => {
      const path = `${__dirname}/YouTube2Plex.js`;
      const filePath = fs.createWriteStream(path);
      res.pipe(filePath);
      filePath.on('finish', () => {
        filePath.close();
        console.log('YouTube2Plex.js is finished updating');
      })
    })

    // force update npm
    childProcess.exec(`npm update`, async (error) => {
      if (error) {
        console.log('error is:', error);
        //or
        throw error;
      }
      console.console.log(finished);
    });
  }

  setTimeout(updateCheck, 10800000)
}
