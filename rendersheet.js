/*
    rendersheet.js <https://github.com/davidfig/rendersheet>
    License: MIT license <https://github.com/davidfig/rendersheet/license>
    Author: David Figatner
    Copyright (c) 2016 YOPEY YOPEY LLC
*/

// Creates a spritesheet texture for pixi.js
// options:
//     width {number}: 2048 (default)
//     height {number}: 2048 (default)
//     testBoxes: false (default) - draw colored boxes around the this.textures
//     buffer {number}: 5 (default) - pixels surrounding each texture
//     scale {number}: 1 (default) - this.scale renderSheet
//     resolution {number}: 1 (default) - change this.resolution of renderSheet
// Usage:
//     var sheet = new RenderSheet();
//     sheet.add(name, funct, param)
//     ...
//     sheet.render()
//     sheet.get(name)
//     sheet.getTexture(name)
function RenderSheet(options)
{
    options = options || {};

    this.testBoxes = options.testBoxes || false;

    this.maxWidth = options.width || 2048;
    this.maxHeight = options.height || 2048;

    this.buffer = options.buffer || 5;

    this.scale = options.scale || 1;
    this.resolution = options.resolution || 1;

    this.canvases = [];
    this.baseTextures = [];
    this.textures = {};
}

// adds a texture to the rendersheeet
//  name {string}: name of texture (for getting)
//  funct {function}: drawing function
//  measure {function}: measure function
//  params {object} any params to pass the measure and drawing functions
RenderSheet.prototype.add = function(name, draw, measure, param)
{
    this.textures[name] = { draw: draw, measure: measure, param: param };
};

// attaches the rendersheet to the DOM for testing purposes
RenderSheet.prototype.show = function(styles)
{
    function r()
    {
        return Math.floor(Math.random() * 256);
    }
    var percent = 1 / this.canvases.length;
    for (var i = 0; i < this.canvases.length; i++)
    {
        var canvas = this.canvases[i];
        var style = canvas.style;
        style.position = 'fixed';
        style.left = '0px';
        style.top = i * Math.round(percent * 100) + '%';
        style.width = 'auto';
        style.height = Math.round(percent * 100) + '%';
        style.zIndex = 1000;
        style.background = 'rgba(' + r() + ',' + r() + ',' + r() + ', 0.5)';
        for (var key in styles)
        {
            style[key] = styles[key];
        }
        document.body.appendChild(canvas);
        if (typeof Debug !== 'undefined')
        {
            debug('#' + (i + 1) + ': rendersheet size: ' + canvas.width + ',' + canvas.height + ' - this.resolution: ' + this.resolution);
        }
    }
};

RenderSheet.prototype.hasLoaded = function()
{
    return texture && texture.hasLoaded;
};

RenderSheet.prototype.measure = function()
{
    var c = document.createElement('canvas');
    c.width = this.maxWidth;
    c.height = this.maxHeight;
    co = c.getContext('2d');
    var multiplier = this.scale * this.resolution;
    for (var key in this.textures)
    {
        var texture = this.textures[key];
        var size = texture.measure(co, texture.param);
        texture.width = Math.ceil(size.width * multiplier);
        texture.height = Math.ceil(size.height * multiplier);
        this.sorted.push(texture);
    }
};

RenderSheet.prototype.sort = function()
{
    this.sorted.sort(function(a, b)
    {
        if (a.height < b.height)
        {
            return -1;
        }
        else if (a.height > b.height)
        {
            return 1;
        }
        else
        {
            if (a.width === b.width)
            {
                return 0;
            }
            else
            {
                return (a.width < b.width) ? -1 : 1;
            }
        }
    });
};

RenderSheet.prototype.createCanvas = function(width, height)
{
    canvas = document.createElement('canvas');
    canvas.width = this.maxWidth;
    canvas.height = this.maxHeight;
    context = canvas.getContext('2d');
    this.canvases.push(canvas);
};

RenderSheet.prototype.place = function()
{
    var x = 0, y = 0, width = 0, height = 0, rowMaxHeight = 0, current = 0;
    var lastRow = [];
    for (var i = 0; i < this.sorted.length; i++)
    {
        var texture = this.sorted[i];
        if (x + texture.width + this.buffer > this.maxWidth)
        {
            x = 0;
            if (y + rowMaxHeight + this.buffer > this.maxHeight)
            {
                this.createCanvas(width, height);
                height = rowMaxHeight;
                current++;
                y = 0;
                for (var j = 0; j < lastRow.length; j++)
                {
                    lastRow[j].canvas = current;
                    lastRow[j].y = y;
                }
            }
            y += rowMaxHeight + this.buffer;
            rowMaxHeight = 0;
            lastRow = [];
        }
        texture.x = x;
        texture.y = y;
        texture.canvas = current;
        lastRow.push(texture);
        if (texture.height > rowMaxHeight)
        {
            rowMaxHeight = Math.ceil(texture.height);
        }
        x += Math.ceil(texture.width) + this.buffer;
        if (x > width)
        {
            width = x;
        }
        if (texture.height + y > height)
        {
            height = Math.ceil(texture.height + y);
        }
    }
    if (y + rowMaxHeight + this.buffer > this.maxHeight)
    {
        this.createCanvas(width, height);
        height = rowMaxHeight;
        current++;
        y = 0;
        for (var j = 0; j < lastRow.length; j++)
        {
            lastRow[j].canvas = current;
            lastRow[j].y = y;
        }
    }
    this.createCanvas(width, height);
};

RenderSheet.prototype.draw = function()
{
    function r()
    {
        return Math.floor(Math.random() * 255);
    }

    var current, context;
    var multiplier = this.scale * this.resolution;
    for (var key in this.textures)
    {
        var texture = this.textures[key];
        if (texture.canvas !== current)
        {
            if (typeof current !== 'undefined')
            {
                context.restore();
            }
            current = texture.canvas;
            context = this.canvases[current].getContext('2d');
            context.save();
            context.scale(multiplier, multiplier);
        }
        context.save();
        context.translate(texture.x / multiplier, texture.y / multiplier);
        if (this.testBoxes)
        {
            context.fillStyle = 'rgb(' + r() + ',' + r() + ',' + r() + ')';
            context.fillRect(0, 0, texture.width / multiplier, texture.height / multiplier);
        }
        texture.draw(context, texture.param);
        context.restore();
    }
    context.restore();
};

RenderSheet.prototype.createBaseTextures = function()
{
    for (var i = 0; i < this.baseTextures.length; i++)
    {
        this.baseTextures[i].destroy();
    }
    this.baseTextures = [];
    for (var i = 0; i < this.canvases.length; i++)
    {
        var base = PIXI.BaseTexture.fromCanvas(this.canvases[i]);
        base.resolution = this.resolution;
        this.baseTextures.push(base);
    }
};

RenderSheet.prototype.render = function()
{
    this.canvases = [];
    this.sorted = [];
    var canvas, context;

    this.measure();
    this.sort();
    this.place();
    this.draw();
    this.createBaseTextures();

    for (key in this.textures)
    {
        var current = this.textures[key];
        if (!current.texture)
        {
            current.texture = new PIXI.Texture(this.baseTextures[current.canvas], new PIXI.Rectangle(current.x, current.y, current.width, current.height));
        }
        else
        {
            current.texture.baseTexture = this.baseTextures[current.canvas];
            current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height);
            current.texture.update();
        }
    }
};

//  find the index of the texture based on the texture object
RenderSheet.prototype.getIndex = function(find)
{
    var i = 0;
    for (var key in this.textures)
    {
        if (i === find)
        {
            return this.textures[key].texture;
        }
        i++;
    }
    return null;
};


// returns the texture object based on the name
RenderSheet.prototype.get = function(name)
{
    return this.textures[name];
};

// returns the PIXI.Texture based on the name
RenderSheet.prototype.getTexture = function(name)
{
    var texture = this.textures[name];
    if (texture)
    {
        return this.textures[name].texture;
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


// returns the number of this.textures in the sprite sheet
RenderSheet.prototype.entries = function()
{
    var size = 0;
    for (var key in this.textures)
    {
        size++;
    }
    return size;
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