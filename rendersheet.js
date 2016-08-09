/*
    rendersheet.js <https://github.com/davidfig/rendersheet>
    License: MIT license <https://github.com/davidfig/rendersheet/license>
    Author: David Figatner
    Copyright (c) 2016 YOPEY YOPEY LLC
*/

var testBoxes = false; // show test boxes

var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

var baseTexture = null;
var texture = null;
var textures = {};

var x = 0;
var y = 0;
var width = 0;
var height = 0;
var rowMaxHeight =0;

var sprite = null;

var maxWidth = 1024;
var buffer = 5;

var scale = 1;

// TODO: not working yet
var resolution = 1;

var options;

// Creates a spritesheet texture for pixi.js
// Options:
//     maxWidth {number}: 1024 (default)
// Usage:
//     var sheet = new RenderSheet();
//     sheet.add(name, funct, param)
//     ...
//     sheet.render()
//     sheet.get(name)
//     sheet.getTexture(name)
function RenderSheet(opts)
{
    options = opts || {};
    maxWidth = options.maxWidth || maxWidth;
    resolution = options.resolution || resolution;
}

// adds a texture to the rendersheeet
//  name {string}: name of texture (for getting)
//  funct {function}: drawing function
//  measure {function}: measure function
//  params {object} any params to pass the measure and drawing functions
RenderSheet.prototype.add = function(name, draw, measure, param)
{
    textures[name] = { draw: draw, measure: measure, param: param };
};

// attaches the rendersheet to the DOM for testing purposes
RenderSheet.prototype.show = function(styles)
{
    var style = canvas.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.zIndex = 1000;
    for (var key in styles)
    {
        style[key] = styles[key];
    }
    document.body.appendChild(canvas);
    if (typeof Debug !== 'undefined')
    {
        debug('rendersheet size: ' + width + ',' + height);
    }
    return canvas;
};

RenderSheet.prototype.hasLoaded = function()
{
    return texture && texture.hasLoaded;
};

RenderSheet.prototype.render = function(isDone)
{
    function measure(texture)
    {
        var size = texture.measure(context, texture.param);
        if (x + size.width > maxWidth / scale)
        {
            y += rowMaxHeight;
            x = 0;
            rowMaxHeight = 0;
        }
        texture.x = x;
        texture.y = y;
        texture.width = Math.ceil(size.width);
        texture.height = Math.ceil(size.height);
        if (texture.height > rowMaxHeight)
        {
            rowMaxHeight = texture.height;
        }
        x += Math.ceil(texture.width) + buffer;
        if (x > width)
        {
            width = x;
        }
        if (texture.height + y > height)
        {
            height = Math.ceil(texture.height + y);
        }
    }

    function draw(texture)
    {
        function r()
        {
            return Math.floor(Math.random() * 255);
        }

        context.save();
        context.translate(texture.x, texture.y);
        if (testBoxes)
        {
            context.fillStyle = 'rgb(' + r() + ',' + r() + ',' + r() + ')';
            context.rect(0, 0, texture.width, texture.height);
            context.fill();
        }
        texture.draw(context, texture.param);
        context.restore();
    }

    x = y = width = height = rowMaxHeight = 0;
    for (var key in textures)
    {
        measure(textures[key]);
    }
    canvas.width = Math.ceil(width * scale * resolution);
    canvas.height = Math.ceil(height * scale * resolution);
    if (scale !== 1 || resolution !== 1)
    {
        context.save();
        context.scale(scale * resolution, scale * resolution);
    }
    for (var key in textures)
    {
        draw(textures[key]);
    }
    if (scale !== 1)
    {
        context.restore();
    }
    texture = PIXI.BaseTexture.fromCanvas(canvas);
    texture.resolution = resolution;
    for (key in textures)
    {
        var current = textures[key];
        if (!current.texture)
        {
            current.texture = new PIXI.Texture(texture, new PIXI.Rectangle(current.x * scale * resolution, current.y * scale * resolution, current.width * scale * resolution, current.height * scale * resolution));
        }
        else
        {
            current.texture.frame = new PIXI.Rectangle(current.x * scale * resolution, current.y * scale * resolution, current.width * scale * resolution, current.height * scale * resolution);
            current.texture.update();
        }
    }
};

//  find the index of the texture based on the texture object
RenderSheet.prototype.getIndex = function(find)
{
    var i = 0;
    for (var key in textures)
    {
        if (i === find)
        {
            return textures[key].texture;
        }
        i++;
    }
    return null;
};


// returns the texture object based on the name
RenderSheet.prototype.get = function(name)
{
    return textures[name];
};

// returns the PIXI.Texture based on the name
RenderSheet.prototype.getTexture = function(name)
{
    var texture = textures[name];
    if (texture)
    {
        return textures[name].texture;
    }
    else
    {
        debug('Texture ' + name + ' not found in spritesheet.', 'error');
        return null;
    }
};

// returns a PIXI.Sprite based on the the name
// also sets sprite anchor to 0.5 (because that's how it should be)
RenderSheet.prototype.getSprite = function(name)
{
    var texture = this.getTexture(name);
    var sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
};


// returns the number of textures in the sprite sheet
RenderSheet.prototype.entries = function()
{
    var size = 0;
    for (var key in textures)
    {
        size++;
    }
    return size;
};

RenderSheet.prototype.scale = function(newScale)
{
    scale = newScale;
};

// add support for AMD (Asynchronous Module Definition) libraries such as require.js.
if (typeof define === 'function' && define.amd)
{
    define(function()
    {
        return {
            RenderSheet: RenderSheet
        };
    });
}

// add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined')
{
    module.exports = RenderSheet;
}

// define globally in case AMD is not available or available but not used
if (typeof window !== 'undefined')
{
    window.RenderSheet = RenderSheet;
}