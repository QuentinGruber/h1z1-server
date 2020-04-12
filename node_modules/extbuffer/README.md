extbuffer
============

Extends Buffer objects with additional convenience methods

[![Build Status](https://travis-ci.org/jseidelin/extbuffer.svg?branch=master)](https://travis-ci.org/jseidelin/extbuffer)

## Usage

```javascript
var ExtBuffer = require("extbuffer");
var fs = require("fs");

var buffer = new ExtBuffer(fs.readFileSync("file.ext"));

// read a signed, 24-bit integer 
buffer.reatInt24LE(0);
```