YouTube2Plex
===============
![GitHub package.json version](https://img.shields.io/github/package-json/v/mixerrules/YouTube2Plex?style=plastic) ![GitHub top language](https://img.shields.io/github/languages/top/mixerrules/YouTube2Plex?style=plastic) ![GitHub all releases](https://img.shields.io/github/downloads/mixerrules/YouTube2Plex/total?label=Downloads&style=plastic) ![GitHub forks](https://img.shields.io/github/forks/mixerrules/YouTube2Plex?color=green&style=plastic)

## What is YouTube2Plex
A simple YouTube to MP3 and MP4 downloader that allows you to add the files directly to your Plex Media Server's content library

## Features
* [X] Easy setup, configuration, and deployment.
* [X] Simple Web UI
* [X] Highest Quality fromat downloads
* [X] Detailed Event Logging
* [ ] Playlist support

## Requirements
![Plex Media Server](https://img.shields.io/badge/Plex%20Media%20Server-v1.3.4%20%26%20Up-brightgreen?style=plastic) ![node-current](https://img.shields.io/node/v/discord.js?label=Node.JS&style=plastic)

* [Node.JS 12 or Higher](https://nodejs.org/en/download/)
* a [Plex Media Server](https://www.plex.tv/media-server-downloads/#plex-media-server)

## Installation & setup

1. Download and install [Node.Js](https://nodejs.org/en/download/)
2. Download the last version of YouTube2Plex
3. Extract YouTube2Plex into a folder
4. open command prompt and navigate to the YouTube2Plex folder
5. (Optional) open YouTube2Plex.js in your favorite text editor and set your plex audio and video folders on line 18 + 19.
6. (Optional) Change the port YouTube2Plex runs on in line 16
6. (Optional) Change line 20 to "1" from "0" for detailed logging in console.
7. do "node YouTube2Plex" in your command prompt
8. enjoy YouTube2Plex!


## Common errors:
**"Could not find ffmpeg executable"**:

  ```
    throw 'Could not find ffmpeg executable, tried "' + npm3Binary + '", "' + npm2Binary + '" and "' + topLevelBinary + '"';
  ```
1. Delete the "node_modules" folder
2. run "NPM install"
3. run YouTube2Plex



## License
[MIT](https://github.com/mixerrules/YouTube2Plex/blob/main/LICENSE)
