const path = require('path');
const fs = require('fs-extra');
const bp = require('body-parser');
const ytdl = require('ytdl-core');
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const app = express();
const port = 818;

var plexVideoFolder = ''; // FULL PATH to Plex Video content folder
var plexMusicFolder = ''; // FULL PATH to Plex Audio content folder

// var enableLogging = '';  1 or 0 - Easy Logging for making reports on the github

app.use(bp.json())
app.use(bp.urlencoded({
  extended: true
}))

app.post('/download', async function(req, res) {

  var youtubelink = req.body.link + "";
  var filetype = req.body.type + "";
  var info = await ytdl.getInfo(youtubelink);

//  console.log(req.body);
//  console.log(filetype);
//  console.log(youtubelink);
//  console.log(info.videoDetails.title);

  if (filetype === "mp3") {
    ytdl(youtubelink, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }.pipe(fs.createWriteStream(`/converted/audios/${info.videoDetails.title}.mp3`)))
    .on('progress', function(progress) {
      console.log('Conversion: ' + Math.round(100*progress.percent)/100 + '% done');
    })
    .on('end', function(err) {
      if (!err)
        console.log(`=======\n${info.videoDetails.title} Audio downloaded successfully\n=======\n`);
    })
  }


  if (filetype === "mp4") {
    ytdl(youtubelink, {
      quality: 'highestvideo'
    }).pipe(fs.createWriteStream(`${info.videoDetails.title}.mp4`));

    ytdl(youtubelink, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).pipe(fs.createWriteStream(`${info.videoDetails.title}.mp3`));

    setTimeout(makethissleep, 15000);

    function makethissleep(){
      new ffmpeg(`${info.videoDetails.title}.mp4`)
        .setFfmpegPath(ffmpegPath)
        .addInput(`${info.videoDetails.title}.mp3`)
        .output(__dirname + '/converted/vidoes/' + `${info.videoDetails.title}.mp4`)

        .on('progress', function(progress) {
          console.log('Conversion: ' + Math.round(100*progress.percent)/100 + '% done');
        })

        .on('end', function(err) {
          if (!err)
            console.log(`=======\n${info.videoDetails.title} Converted Successfully\n=======\n`);
            // Delete only audio MP3
            fs.unlink(`${info.videoDetails.title}.mp3`, function (err) {
              if (err) throw err;
              console.log('Temp MP3 deleted!');
            });
            // Code to Delete MP4 with no audio
            fs.unlink(`${info.videoDetails.title}.mp4`, function (err) {
              if (err) throw err;
              console.log('Temp MP4 deleted!');
            });


        })
        .on('error', function(err) {
          console.log('error: ' + err);
        }).run()
    }

  } else {
    // catch error if unchecked
  };

  res.redirect(301, 'panel');
});

app.get('/MoveMP3s', function(req, res) {

  fs.move(__dirname + '/converted/audio/', plexMusicFolder, err => {
    if (err) return console.error(err)
    console.log('======\nMP3s moved successfully!\n=======\n')
  })

  res.redirect(301, 'panel');
});

app.get('/MoveMP4s', function(req, res){

  fs.move(__dirname + '/converted/vidoes/', plexVideoFolder, err => {
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
if (!fs.existsSync(__dirname + '/converted/')){
    fs.mkdirSync(__dirname + '/converted/');
    fs.mkdirSync(__dirname + '/converted/videos/');
    fs.mkdirSync(__dirname + '/converted/audio/');
}
