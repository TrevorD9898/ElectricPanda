// page stuff
var output_elem = document.getElementById("output");

// -----start Bamboo library-----
// ---lower-level helper/engine functions---
// --library: array--
function CreateArray2D( rows, cols, defaultValue )
{
	var arr = [];
	for(var i=0; i < rows; i++)
	{
		arr.push([]);

		arr[i].push( new Array(cols));

		for(var j=0; j < cols; j++)
		{
			arr[i][j] = defaultValue;
		}
	}
	return arr;
}
// --library: math--
// base log finder
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}
// a weighted random roll
function weightRand(rolls, num)
{
	let val = 0;
	for (let i = 0; i < rolls; ++i)
	{
		val += Math.floor( Math.random() * (num+1));
	}
	return val;
}
// --library: I/O--
function output(print_string)
{
	output_elem.innerHTML += print_string + '<br>';
	output_elem.scrollTop = output_elem.scrollHeight;
}
// -----end Bamboo library-----

// ----canvas func----
function CreateGameGfx()
{
	var newCanvas = document.createElement('canvas');
	newCanvas.width = 64;
	newCanvas.height = 16;
	var ctx = newCanvas.getContext ('2d');
		//draw gfx
		ctx.fillStyle = "#5A9BDC";
		ctx.fillRect(16, 0, 16, 16);
		ctx.fillStyle = "#31FF31";
		ctx.fillRect(32, 0, 16, 16);
		ctx.fillStyle = "#aaBC4c";
		ctx.fillRect(48, 0, 16, 16);
	return newCanvas;
}

// ----world gen----
var Mapgen = {};
// ------mapgen funcs------ 
Mapgen.init = function()
{
	let t = this; //classic 'this'
	t.mapsize = Game.width;
	t.data = CreateArray2D(t.mapsize,t.mapsize,1);
	// neighbors: up, down, left, and right...
	t.neighbor_mask = [[0,-1],[0, 1],[-1, 0],[1, 0]];
	// automata steps
	t.max_cuts = Math.floor(getBaseLog(2, t.mapsize));
	t.start_cuts = Math.floor( t.max_cuts / 2.8 );
	t.walk_step = t.start_cuts-1;
	// gen status
	t.gen_started = false;
	t.gen_finished = false;
}
// ----------------------------------------------
Mapgen.fill_cell = function(cx,cy,grid_size,value)
{
	let t = this; // this...
	let begin_x = cx * grid_size;
	let end_x = (cx+1) * grid_size;
	let begin_y = cy * grid_size;
	let end_y = (cy+1) * grid_size;

	for (let x = begin_x; x < end_x; x++){
		for (let y = begin_y; y < end_y; y++){
			if (t.data[x][y] != 0) t.data[x][y] = value;
		}  
	}
}
Mapgen.find_neighbors = function(x, y, grid_size, match_val)
{
	let t = this;
	let return_val = 0;
	let mask = t.neighbor_mask;
	let cx, cy = [0,0];
	let mask_x, mask_y = [0,0];
	// for all neighbors...
	for (let n=0; n < mask.length; ++n)
	{
		mask_x = mask[n][0];
		mask_y = mask[n][1];
		cx = (mask_x + x) * grid_size;
		cy = (mask_y + y) * grid_size;
		// debug 
		//print_out('cx: '+cx+' -- cy: '+cy);
		// discard if out of bounds...
		if (cx >= 0 && cx < t.mapsize)
		{
			if (cy >= 0 && cy < t.mapsize)
			{
				if (t.data[cx][cy] == match_val) return_val++;
			}
		}
	}
	return return_val;
}

Mapgen.automata = function(step)
{
	let t = this;
	
	//---start generation...---
	let i = step;
	
	// gen vars
	let fill_type = 0; let score = 0;
	
	// calc grid_size and cell_size
	let grid_size = t.mapsize / Math.pow(2, (step+1));
	let cell_size = t.mapsize / grid_size;
	output(grid_size + " / " + cell_size);
	
	//---run automata---
	//if first step...
	if (i == t.start_cuts)
	{
		// optimal settings: 3,8,16
		let num_dice = 3;
		let dice_sides = 8;
		let roll_over = 15;
		// for all cells...
		for (let x = 0; x < cell_size; x++){ 
		for (let y = 0; y < cell_size; y++){
			//weighted roll: 3dChance...
			if (weightRand(num_dice, dice_sides) > roll_over) 
				fill_type = 2; else fill_type = 1;
			//fill...
			t.fill_cell(x,y,grid_size,fill_type);
		}}
	}
	//if not first step...
	else
	{
		// optimal settings: 94, 93, 26-27
		// generate
		let sprawl = 94;
		let roll = 93;
		let fatness = 26;
		// for all cells...
		for (let x = 0; x < cell_size; x++){ 
		for (let y = 0; y < cell_size; y++){
			score = t.find_neighbors(x,y,grid_size,2);
			if ( weightRand(1, roll) > sprawl - (score * fatness))
				t.fill_cell(x,y,grid_size,2);
			else
				t.fill_cell(x,y,grid_size,1);
		}}
	}
	
	//---post-process---
	if (i == t.start_cuts)
	{
		for (let g = 0; g < cell_size; g++)
		{ 
			t.fill_cell(0, g, grid_size, 1);
			t.fill_cell(g, 0, grid_size, 1);
			t.fill_cell(g, cell_size-1, grid_size, 1);
			t.fill_cell(cell_size-1, g, grid_size, 1);
		}
	}
};

Mapgen.add_features = function()
{
	let t = this;
	for (let x = 0; x < t.mapsize; x++){
	for (let y = 0; y < t.mapsize; y++)
	{
		//beach
		if  (t.data[x][y] == 1)
		{
			if (t.find_neighbors(x,y,1,1) < 1){
				t.data[x][y] = 2;
			}
		}
	}}
}
// ------------meta-gen------------
Mapgen.step_gen = function()
{
	let t = this; // this...
	// init
	if (t.gen_started == false) t.gen_started = true;
	// step-thru
	
	if (t.walk_step < t.max_cuts)
	{
		
		t.automata( t.walk_step );
		t.walk_step++;
		Game.draw();
	}
}




// ----game----
// game object singleton
var Game = new Object();
// game.canvas...
Game.canvas = document.getElementById("game_canvas");
Game.ctx = Game.canvas.getContext("2d");
Game.width = Game.canvas.width;
Game.height = Game.canvas.height;
// off-screen render target
Game.off_canvas = document.createElement('canvas'); 
Game.off_canvas.width = Game.canvas.width;
Game.off_canvas.height = Game.canvas.height;
Game.off_ctx = Game.canvas.getContext("2d");
{
	let width = Game.off_canvas.width;
	let height = Game.off_canvas.height;
	Game.offData = Game.off_ctx.createImageData(width, height);
}
for (let i=0; i < Game.offData.data.length; i+=4)
{
	Game.offData.data[i+0] = Math.random() * 255 | 0; // red
	Game.offData.data[i+1] = Math.random() * 255 | 0; // green
	Game.offData.data[i+2] = Math.random() * 255 | 0; // blue
	Game.offData.data[i+3]=255; // fill alpha channel with max val
}
Game.ctx.putImageData(Game.offData,0,0);

//-----Game functions...-----
Game.init = function()
{
	// game map gen...
	Game.graphics = CreateGameGfx();
	Mapgen.init();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Mapgen.step_gen();
	Game.draw();
}
Game.draw = function()
{
	blit_fast( Game.offData );
	Game.ctx.putImageData(Game.offData,0,0);
}
function warp_canvas(fromData, toData)
{
  let i = -4;
  for (let cy = 0; cy < toData.height; ++cy)
  {
	for (let cx = 0; cx < toData.width; ++cx)
	{
	  let shader_y = cy + (Math.cos(cx * 0.09 + game.time) * 3.8);
	  shader_y = shader_y | 0;
	  let to_index = ((shader_y*toData.width)+cx)*4;
	  i+=4; // pixel placement in raw data
	  // set 'to' data
	  toData.data[to_index+0] = fromData.data[i+0]; // red
	  toData.data[to_index+1] = fromData.data[i+1]; // green
	  toData.data[to_index+2] = fromData.data[i+2]; // blue
	}
  }
}
Game.color_table =
[
	[255,  0,  0],
	[  0,  0,255],
	[  0,255,  0],
	[212,175, 76]
]
function blit_fast(to_data)
{
	let i = -4;
	let index, R,G,B = [0,0,0,0];
	// for all map pixels/data
	for (let x = 0; x < Mapgen.mapsize; ++x){
	for (let y = 0; y < Mapgen.mapsize; ++y){
		index = Mapgen.data[x][y];
		R = Game.color_table[ index ][0];
		G = Game.color_table[ index ][1];
		B = Game.color_table[ index ][2];
		i+=4; // next pixel in data
		//set data
		to_data.data[i+0] = R; // red
		to_data.data[i+1] = G; // green
		to_data.data[i+2] = B; // blue
	}}
}
function posToIndex(pos_x, pos_y, width)
{
  return (pos_x*width)+pos_y;
}
