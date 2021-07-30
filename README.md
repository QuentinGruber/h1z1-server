# h1z1-server [![npm version](http://img.shields.io/npm/v/h1z1-server.svg?style=flat)](https://npmjs.org/package/h1z1-server "View this project on npm")

## Description

Based on the work of @jseidelin on [soe-network](https://github.com/psemu/soe-network),
h1z1-server is a library that emulate a h1z1(just survive) server.

## Motivation

A redditor said : "It's just matter of effort and to have enough people of with interest towards having such private servers to the respected game.
I highly doubt that H1Z1 (Just Survive) is one of those."

So we will see :)


## Thanks list

- Thank to UTIL_TRACELINE for his involvement in the project, the project would not be in this state today without him.

- Thank to Hax max for his determination and hacking skills :stuck_out_tongue:.

- Thank to LcplReaper for his interest in the project and the management of the community around the project.

- Thank to Meme for being an OG/active contributor :smile:.

- Thank to Avcio for his dedication on gameplay improvement.

- Thank to Rhett for his interest in the project and his research on the Forgelight engine in general.

- Thank to LegendsNeveerrDie for is work on editing the map.

- Thank to Chriis who provided the basis for this project by being the first (as far as I know) to try to emulate servers for h1z1 and who inspired me.

- Thank to Jacob Seidelin without whom none of this would have been possible.

- Thank to all those who sent messages of help and support and perpetuated the hope of playing h1z1 again.

## Setup H1Z1

### How to download it

#### Using our custom implementation of DepotDownloader

[Download the latest version of H1DepotDownloader](https://github.com/H1emu/H1DepotDownloader/releases)

#### Using DepotDownloader

Use [DepotDownloader](https://github.com/SteamRE/DepotDownloader) ( only work if you've bought h1z1 )

AppID : 295110 DepotID : 295111 ManifestID : 1930886153446950288

How to use DepotDownloader : https://youtu.be/44HBxzC_RTg

cmd : `.\DepotDownloader.exe -app 295110 -depot 295111 -manifest 1930886153446950288 -username username -password 1234`

### H1Z1 Dependencies

Like all games H1Z1 has C/C++ & DirectX dependencies.

You may already have them but just in case

- VC 2010 Redist

- VC 2015 Redist

- DirectX Jun 2010 Redist

You can download them all [here](https://mega.nz/file/RtwDWJ7b#QYlxpXz_t0_kp7_S8a7whnWsctJ3Fr5B2sQdnuTR9LQ)

### Setup ClientConfig.ini

On the H1Z1 game folder there is a file name "ClientConfig.ini".

Add `sessionid=0` at the beginning of this file.

And change the _Server_ value to the address of your server , probably `localhost:PORT`

### Launch the game

If you have followed the step just above this one, this step is no longer necessary you can start the game by double clicking on H1Z1.exe.

Execute this command in CMD/Powershell ( you have to be in your h1z1 game folder ) :

`.\H1Z1.exe sessionid=0 server=localhost:1115`

## Demo

* https://github.com/H1emu/h1emu-launcher/releases/latest

* [h1z1-server-QuickStart](https://github.com/H1emu/h1z1-server-QuickStart) and follow the instruction in wrote in his README

### Enable Debug log

Since v0.2.3 of h1z1-server the npm package [debug](https://www.npmjs.com/package/debug) is used to make debug logs.

##### examples :

* `set DEBUG=* & node loginserver.js`
* `set DEBUG=ZoneServer & node zoneserver.js`
