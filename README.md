# h1z1-server

## Description

Based on the work of @jseidelin on [soe-network](https://github.com/psemu/soe-network),
h1z1-server is a library trying to emulate a h1z1(just survive) server.

## Current Goal

Making this work for the 15 January 2015 version of H1Z1 (first version).

## Setup H1Z1

### Download it

Use [DepotDownloader](https://github.com/SteamRE/DepotDownloader) ( only work if you've bought h1z1 )

AppID : 295110 DepotID : 295111 ManifestID : 1930886153446950288

How to use DepotDownloader : https://youtu.be/44HBxzC_RTg

### Setup ClientConfig.ini

On the H1Z1 game folder there is a file name "ClientConfig.ini".

Open it and change the *Server* value to the adress of your server , probably `localhost:PORT`

### Launch the game

Execute this command in CMD/Powershell ( you have to be in your h1z1 game folder ) :

`.\H1Z1.exe  inifile=ClientConfig.ini providerNamespace=soe sessionid=0 CasSessionId=0 Interna
tionalizationLocale=en_US LaunchPadUfp={fingerprint} LaunchPadSessionId=0 STEAM_ENABLED=0`


## Current State

- [x] SessionRequestReply
- [x] LoginRequestReply

The client sends back an Ack right now .


## How to use

You need [Nodejs](https://nodejs.org/en/) ( currently using 12.16 LTS).

`npm i h1z1-server` to install package 

Now you can use the library like that : 


    const H1server = require("h1z1-server");
    
    var server = new H1server.LoginServer(
      295110, // <- AppID
      "dontnow", // <- environment
      true, // <- using MongoDB (boolean)
      1115, // <- server port
      "fuckdb", // <- loginkey
      "dontnow" // <- backend
     );
     server.start();


*I will make more documentation later*

## More resources

Here is a fork of the soe-network repository with updated dependencies without my work :

https://github.com/QuentinGruber/soe-network

@ChrisHffm attempts to do the same thing you can find his repository here : 

https://github.com/ChrisHffm/H1Z1-Server
