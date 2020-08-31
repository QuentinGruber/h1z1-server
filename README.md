# h1z1-server [![npm version](http://img.shields.io/npm/v/h1z1-server.svg?style=flat)](https://npmjs.org/package/h1z1-server "View this project on npm")

## Description

Based on the work of @jseidelin on [soe-network](https://github.com/psemu/soe-network),
h1z1-server is a library trying to emulate a h1z1(just survive) server.

## Motivation

"It's just matter of effort and to have enough people of with interest towards having such private servers to the respected game.
I highly doubt that H1Z1 (Just Survive) is one of those."

## Current Goal

Making this work for the 15 January 2015 version of H1Z1 (first version).

## Setup H1Z1

### Download it

Use [DepotDownloader](https://github.com/SteamRE/DepotDownloader) ( only work if you've bought h1z1 )

AppID : 295110 DepotID : 295111 ManifestID : 1930886153446950288

How to use DepotDownloader : https://youtu.be/44HBxzC_RTg

cmd : `dotnet .\DepotDownloader.dll -app 295110 -depot 295111 -manifest 1930886153446950288 -username username -password 1234`

### H1Z1 Dependencies

Like all games H1Z1 has C/C++ & DirectX dependencies.

You may already have them but just in case

- VC 2010 Redist

- VC 2015 Redist

- DirectX Jun 2010 Redist

You can download them all [here](https://mega.nz/file/RtwDWJ7b#QYlxpXz_t0_kp7_S8a7whnWsctJ3Fr5B2sQdnuTR9LQ)

### Setup ClientConfig.ini

On the H1Z1 game folder there is a file name "ClientConfig.ini".

Open it and change the _Server_ value to the adress of your server , probably `localhost:PORT`

### Launch the game

Execute this command in CMD/Powershell ( you have to be in your h1z1 game folder ) :

`.\H1Z1.exe inifile=ClientConfig.ini providerNamespace=soe sessionid=0 CasSessionId=0 Interna tionalizationLocale=en_US LaunchPadUfp={fingerprint} LaunchPadSessionId=0 STEAM_ENABLED=0`

## Setup [MongoDB](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-4.4.0-signed.msi)

- Create a database named "h1server" with a collection named "servers"

- Add the following code as a document, this is a server's info template:

`{
                    serverId: 1,
                    serverState: 2,
                    locked: false,
                    name: "SoloServer",
                    nameId: 8,
                    description: "yeah",
                    descriptionId: 1,
                    reqFeatureId: 0,
                    serverInfo:
                    "<ServerInfo Region=\"CharacterCreate.RegionUs\" Subregion=\"UI.SubregionUS\" IsRecommended=\"1\" IsRecommendedVS=\"0\" IsRecommendedNC=\"0\" IsRecommendedTR=\"0\" />",
                    populationLevel: 3,
                    populationData:
                    "<Population ServerCapacity=\"0\" PingAddress=\"127.0.0.1:1117\" Rulesets=\"Permadeath\"><factionlist IsList=\"1\"><faction Id=\"1\" Percent=\"0\" TargetPopPct=\"0\" RewardBuff=\"52\" XPBuff=\"52\" PercentAvg=\"0\"/><faction Id=\"2\" Percent=\"0\" TargetPopPct=\"1\" RewardBuff=\"0\" XPBuff=\"0\" PercentAvg=\"0\"/><faction Id=\"3\" Percent=\"0\" TargetPopPct=\"1\" RewardBuff=\"0\" XPBuff=\"0\" PercentAvg=\"1\"/></factionlist></Population>",
                    allowedAccess: true,
                  }`

## How to use

### Use the app

The application is at the very beginning of its development, it can contain bugs and is very minimalist.

Download here : https://github.com/QuentinGruber/h1z1-server-app/releases

### Quick Start

Clone this repo : [h1z1-server-QuickStart](https://github.com/QuentinGruber/h1z1-server-QuickStart)

### Installation

You need [Nodejs](https://nodejs.org/en/) ( currently using 12.16 LTS).

`npm i h1z1-server` to install package

### LoginServer

    const H1Z1servers = require("./h1z1-server");
    const { Base64 } = require("js-base64");
    var server = new H1Z1servers.LoginServer(
    295110, // <- AppID
    "dev", // <- environment
    false, // <- using MongoDB
    1115, // <- server port
    Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="), // <- loginkey
    true // <- SoloMode
    );
    server.start();

### Enable Debug log

Since v0.2.3 of h1z1-server the npm package [debug](https://www.npmjs.com/package/debug) is used to make debug logs.

Windows command prompt notes
CMD
On Windows the environment variable is set using the set command.

    set DEBUG=*,-not_this

Example:

    set DEBUG=* & node app.js

PowerShell (VS Code default)
PowerShell uses different syntax to set environment variables.

    $env:DEBUG = "*,-not_this"

Example:

    $env:DEBUG='app';node app.js

Then, run the program to be debugged as usual.

npm script example:

    "windowsDebug": "@powershell -Command $env:DEBUG='*';node app.js",

#### My debug scripts

From my package.json, if it can help.

    "scripts": {
        "login-server": "set DEBUG=* & node loginserver.js",
        "login-client": "set DEBUG=* & node loginclient.js",
        "gateway-server": "set DEBUG=* & node GatewayServer.js",
        "zone-server": "set DEBUG=* & node ZoneServer.js",
        "zone-client": "set DEBUG=* & node ZoneClient.js"
    }

### Legal

This project is for educational purposes. I am not responsible for your actions with it.
