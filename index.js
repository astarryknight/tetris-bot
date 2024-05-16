//NO CONSOLE>GLIJDGLSIDJFLDSJF
function debug(text){
    document.getElementById("debug").textContent=text;
}

window.onerror = function(e, url, line){
    debug('onerror: ' + e + ' URL:' + url + ' Line:' + line);
    return true;
}

var auto=true;

const canvasWidth = 450;
const canvasHeight = 600;
const squareHeight = 30;

const height = canvasHeight/squareHeight;
const width = canvasWidth/squareHeight;

function draw(pieces, queue) {
    const canvas = document.getElementById("canvas");
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);//clear canvas

        //initial board render:
        var style=0;
        for(c=0;c<(width);c++){
            for(r=0;r<(height);r++){
                if(style%2==0){
                    ctx.fillStyle = "#242424";
                } else{
                    ctx.fillStyle = "#4a4949";
                }
                ctx.fillRect((c*squareHeight), (r*squareHeight), squareHeight, squareHeight);
                style++;
            }
            style++;
        }

        //calculate shadow
        var x=pieces[0].pos[0];
        var y=pieces[0].pos[1];
        shadow = new Piece([x,y], pieces[0].piecePos, "#B4B3B3", pieces[0].id);
        free=freeY(shadow)
        while(free&&shadow.pos[1]<(height-1)){
            shadow.pos = [shadow.pos[0], shadow.pos[1]+1];
            free=freeY(shadow);
        }
        //draw shadow
        ctx.fillStyle=shadow.color;
        var p = shadow.piecePos;
        var x = shadow.pos[0];
        var y = shadow.pos[1];
        for(j=0;j<p.length;j++){
            ctx.fillRect((p[j][0]+x)*squareHeight,(p[j][1]+y)*squareHeight, squareHeight, squareHeight);
        }


        //draw pieces
        for(i=0;i<pieces.length;i++){
            ctx.fillStyle=pieces[i].color;
            var p = pieces[i].piecePos;
            var x = pieces[i].pos[0];
            var y = pieces[i].pos[1];
            for(j=0;j<p.length;j++){
                ctx.fillRect((p[j][0]+x)*squareHeight,(p[j][1]+y)*squareHeight, squareHeight, squareHeight);
            }
        }
        //draw queue
        for(i=0;i<queue.length;i++){
            ctx.fillStyle=queue[i].color;
            var xShift = width+1; //how far off the main game section the blocks will appear
            var yShift = 3; //initial y offset
            var p = queue[i].piecePos;
            for(j=0;j<p.length;j++){
                ctx.fillRect((p[j][0]+xShift)*squareHeight,(p[j][1]+yShift+i*5)*squareHeight, squareHeight, squareHeight)
            }
        }

        //draw held piece
        var xOff=width+6;
        var yOff=5;
        if(!isEmpty(heldPiece)){ //does it exist? - makes sure it doesn't try to draw nothing
            ctx.fillStyle=heldPiece.color;
            var p = heldPiece.piecePos;
            var x = heldPiece.pos[0];
            var y = heldPiece.pos[1];
            for(j=0;j<p.length;j++){
                ctx.fillRect((p[j][0]+xOff)*squareHeight,(p[j][1]+yOff)*squareHeight, squareHeight, squareHeight);
            }
        }
        //text
        ctx.fillStyle="#000000";
        ctx.font = "20px arial";
        ctx.fillText("Held Piece:", (width+6)*squareHeight, 50);
    }
    document.getElementById("pps").textContent = "PPS: "+getPPS();
    document.getElementById("clears").textContent = "Clears: "+totalClears;
    document.getElementById("score").textContent = "Score: "+score;
}

/*https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object*/
function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
  
    return true;
}

/* look at this later https://stackoverflow.com/questions/54562790/cannot-set-property-which-only-has-getter-javascript-es6*/
class Piece {
    constructor(pos, piecePos, color, id) {
      this.pos_ = pos;
      this.piecePos_ = piecePos;
      this.color_ = color;
      this.id_ = id
    }
    get pos(){
        return this.pos_;
    }
    get piecePos(){
        return this.piecePos_;
    }
    get color(){
        return this.color_;
    }
    get id(){
        return this.id_;
    }
    set pos(pos){
        this.pos_=pos;
    }
    set piecePos(piecePos){
        this.piecePos_ = piecePos;
    }
}

var game=true;
var gameSpeed=1000;
var speed=gameSpeed; //inverse scale - lower number = faster speed

//piece order: T, J, Z, S, I, L, O
var pieceList=[[[0,-1], [1,-1], [1,0], [2,-1]], [[0,0], [1,0], [1,-1], [1,-2]], [[0,-1], [1,-1], [1,0], [2,0]], [[0,0], [1,0], [1,-1], [2,-1]], [[0,0], [0,-1], [0,-2], [0,-3]], [[0,0], [1,0], [0,-1], [0,-2]], [[0,0], [1,0], [0,-1], [1,-1]]];  //0,0 at the bottom left corner of the object

//in clockwise order from base stance
var firstInv=[[[0,-1], [1,0], [1,-1], [1,-2]], [[0,-1], [0,0], [1,0], [2,0]], [[0,0], [0,-1], [1,-1], [1,-2]], [[0,-2], [0,-1], [1,-1], [1,0]], [[0,0], [1,0], [2,0], [3,0]], [[0,0], [0,-1], [1,-1], [2,-1]], [[0,0], [1,0], [0,-1], [1,-1]]];  //0,0 at the bottom left corner of the object;

var secondInv=[[[0,0], [1,0], [1,-1], [2,0]], [[0,0], [0,-1], [0,-2], [1,-2]], [[0,-1], [1,-1], [1,0], [2,0]], [[0,0], [1,0], [1,-1], [2,-1]], [[0,0], [0,-1], [0,-2], [0,-3]], [[0,-2], [1,-2], [1,-1], [1,0]], [[0,0], [1,0], [0,-1], [1,-1]]];  //0,0 at the bottom left corner of the object;

var thirdInv=[[[0,0], [0,-1], [0,-2], [1,-1]], [[0,-1], [1,-1], [2,-1], [2,0]], [[1,0], [1,-1], [2,-1], [2,-2]], [[1,-2], [1,-1], [2,-1], [2,0]], [[0,0], [1,0], [2,0], [3,0]], [[0,0], [1,0], [2,0], [2,-1]], [[0,0], [1,0], [0,-1], [1,-1]]];  //0,0 at the bottom left corner of the object;

var colors=["#b642f5", "#4542f5", "#45cc33", "#cf2e2b", "#32ede4", "#e38a1e", "#f5e342"]


var pieces=[];
var rot=0;
var heldPiece;
var calc=false;

//auto move implementation
var autoMoves=[];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomPiece(){
    var n=getRandomInt(6);
    if(pieces.length>1&&n==pieces[1].id){
        n++;
    }
    return new Piece([0,2], pieceList[n], colors[n], n);
}

pieces.push(getRandomPiece());
// var i = new Piece([6,2], pieceList[4], colors[4], 4);
var queue=[getRandomPiece(), getRandomPiece(), getRandomPiece(), getRandomPiece()];
var free=true; //the piece is free from other pieces (not contacting)
var hold=true; //can you hold a new piece

var totalClears=0;
var score=0;


window.addEventListener("load", draw(pieces, queue));
var tickStart=Date.now();
var start=Date.now();

function getOccupiedSquares(){
    var l=[];
    var piece;
    var p;
    var pos;
    for(i=1;i<pieces.length;i++){
        piece = pieces[i];
        p = piece.piecePos;
        pos = piece.pos;
        for(j=0;j<p.length;j++){
            l.push([p[j][0]+pos[0], p[j][1]+pos[1]]);
        }
    }
    /*https://builtin.com/software-engineering-perspectives/remove-duplicates-from-array-javascript*/
    return l.filter((value, index) => l.indexOf(value) === index); //actually implement this properly? - not needed since pieces cant really clip into others (or else thats a bigger problem)
}

function freeX(piece){ //checks if the piece is free to move in the x direction
    var p=piece.piecePos;
    var pos=piece.pos;
    var l=getOccupiedSquares();
    var freeR=true;//free to move right
    var freeL=true;//free to move left
    for(i=0;i<p.length;i++){
        for(j=0;j<l.length;j++){
            if(((p[i][1]+pos[1])==l[j][1] && (p[i][0]+pos[0]+1)==l[j][0])){
                freeR=false;
            }
            if((p[i][1]+pos[1])==l[j][1] && (p[i][0]+pos[0]-1)==l[j][0]){
                freeL=false;
            }
        }
        if((p[i][0]+pos[0]+1)>(width-1)) { freeR=false; }
        if((p[i][0]+pos[0]-1)<0) { freeL=false; }
    }
    return [freeR, freeL];
}

function freeY(piece){
    free=true;
    var p=piece.piecePos;
    var pos=piece.pos;
    var l=getOccupiedSquares();
    for(i=0;i<p.length;i++){
        for(j=0;j<l.length;j++){
            if((p[i][0]+pos[0])==l[j][0] && (p[i][1]+pos[1]+1)==l[j][1]){
                free=false;
            }
        }
    }
    return free;
}

function freeRot(rotPiece){
    free=true;
    var p=rotPiece.piecePos;
    var pos=rotPiece.pos;
    var l=getOccupiedSquares();
    for(i=0;i<p.length;i++){
        for(j=0;j<l.length;j++){
            if((p[i][0]+pos[0])==l[j][0] && (p[i][1]+pos[1])==l[j][1]){
                free=false;
            }
        }
        if((p[i][0]+pos[0])<0 || (p[i][0]+pos[0])>(width-1)) { free=false; }
    }
    return free;
}

function getFullRows(l){
    var totals=[];
    var rows=[];
    for(i=0;i<height;i++){totals.push(0);}
    for(j=0;j<l.length;j++){
        totals[l[j][1]]++
    }
    for(k=0;k<totals.length;k++){
        if(totals[k]==width){
            rows.push(k);
        }
    }
    return rows;
}

function clearRows(r){
    if(r.length==1){score+=(Math.floor(totalClears/10)+1)*40}
    else if(r.length==2){score+=(Math.floor(totalClears/10)+1)*100}
    else if(r.length==3){score+=(Math.floor(totalClears/10)+1)*300}
    else{score+=(Math.floor(totalClears/10)+1)*1200}
    for(i=0;i<r.length;i++){ //iterating through each full row
        for(j=1;j<pieces.length;j++){ //iterating through each piece in the pieces array
            var p=pieces[j].piecePos; //array for piece definition positions
            var pos=pieces[j].pos; //array for position of each piece
            var test=[];
            var moveDown=[];
            for(k=0;k<p.length;k++){ //iterating through each square in a piece
                if(!((p[k][1]+pos[1])==r[i])){ //if the square is NOT in the same horizontal row as the full row
                    if(p[k][1]+pos[1]<r[i]){
                        test.push([p[k][0], p[k][1]+1]);
                    } else{
                        test.push(p[k]);
                    }
                } 
            }
            pieces[j].piecePos=test;

            //LOOK AT PEIOCE ROTATUOIBNS DUIFHSD IFUHS DIFUSHD IFUHS DIUFHSD UIFHDFS ROTATION
        }
        totalClears++;
    }
    //debugger;
}

function getPPS(){
    var now = Date.now();
    var eTime = (now-tickStart)/1000; //elapsed time in seconds
    return Math.round((pieces.length/eTime) * 100) / 100; //pieces/sec, rounded to 2 decimal places (https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary?page=1&tab=scoredesc#tab-top)
}

function getTempOccupiedSquares(piece){
    var l=getOccupiedSquares();
    p = piece.piecePos;
    pos = piece.pos;
    for(j=0;j<p.length;j++){
        l.push([p[j][0]+pos[0], p[j][1]+pos[1]]);
    }
    return l;
}

function includesArray(main, compare){
    for(i=0;i<main.length;i++){
        if(main[i][0]==compare[0] && main[i][1]==compare[1]){return true;}
    }
    return false;
}

function getGameBoard(l){
    var board=[];
    for(i=0;i<height;i++){ //populate array with default values
        var temp=[]
        for(j=0;j<width;j++){
            temp.push(false);
        }
        board.push(temp);
    }
    for(i=0;i<l.length;i++){ //add occupied squares to array
        board[l[i][1]][l[i][0]]=true;
    }
    return board;
}

function getColumnHeight(x, gb){
    var l=gb;
    for(i=0;i<l.length;i++){
        if(l[i][x]==true){
            return (height-i)
        }
    }
    return 0;
}

/*function getAggregateHeight(temp){    WHAT THE SIGMA (FOR LOOP????)
    var aHeight=0;
    var test=[]
    var l=getGameBoard(temp);
    for(j=0;j<width;j++){
        t=getColumnHeight(j, temp);
        test.push(j);
        aHeight=aHeight+t;
    }
    debug(test);
    return aHeight;
}*/

function getAggregateHeight(gb){
    var x=0;
    var t=0;
    while(x<(width-1)){
        t+=getColumnHeight(x,gb);
        x++;
    }
    return t;
}

function getCompleteLines(gb){
    return getFullRows(gb).length;
}

function getBumpiness(gb){
    var bumpiness=0;
    var test=[];
    var l=gb;
    // for(i=1;i<l[0].length;i++){
    //     bumpiness+=(Math.abs(getColumnHeight(i,l)-getColumnHeight(i-1,l)));
    // }
    var x=1;
    while(x<(width-1)){
        bumpiness+=(Math.abs(getColumnHeight(x,l)-getColumnHeight(x-1,l)));
        test.push(0);
        x++;
    }
    return bumpiness;
    //return bumpiness;
}

function getHoles(gb){
    var holes=0;
    var l=gb;
    for(i=0;i<l[0].length;i++){
        for(j=0;j<l.length-1;j++){
            if(l[j][i]==true&&l[j+1][i]==false){
                var t=j;
                //while((t<l.length-1)&&l[t+1][i]==false){
                    holes++;
                //}
            }
        }
    }
    return holes;
}

function isClogging(x, gb, temp){
    if((temp.id==0||temp.id==1)&&(x+1)<width){
        var oldH=getColumnHeight(x+1, getGameBoard(getOccupiedSquares()));
        var newH=getColumnHeight(x+1, gb);
        if((oldH==0&&newH!=0)||(newH-oldH)>3){return newH-oldH;}
        //if(newH-oldH>=2&&newH<gb[newH-1][x]==0){ return newH-oldH; }

        //l and j clog OTHER lines than the ones their x occupies...
        //J&T clogs line to the right and l clogs line to the left
        //CHECK THOSE AND 500+

        return 0;
    } else if (temp.id==5&&(x-1)>0){
        var oldH=getColumnHeight(x-1, getGameBoard(getOccupiedSquares()));
        var newH=getColumnHeight(x-1, gb);
        if((oldH==0&&newH!=0)||(newH-oldH)>3){return newH-oldH;}
        return 0;
    }
    else{
        return 0;
    }
} //test this

class Candidate {
    constructor(moveX, rotation, moveScore) {
        this.moveX_ = moveX;
        this.rotation_ = rotation;
        this.moveScore_ = moveScore;
    }
    get moveX(){
        return this.moveX_;
    }
    get rotation(){
        return this.rotation_;
    }
    get moveScore(){
        return this.moveScore_;
    }
}

var c_holes = -1.76;
// var c_height = -0.51;
var c_clear = 1.16;
var c_low = 0.25;
var c_bump = -0.184;

var c_clog=-3.5;

//event listeners for inputs to edit constants
var h=document.getElementById("holes");
var c=document.getElementById("clear");
var l=document.getElementById("low");
var b=document.getElementById("bump");
h.addEventListener("change", ()=>{c_holes=h.value});
c.addEventListener("change", ()=>{c_clear=c.value});
l.addEventListener("change", ()=>{c_low=l.value});
b.addEventListener("change", ()=>{c_bump=b.value});

//init values
h.value=c_holes;
c.value=c_clear;
l.value=c_low;
b.value=c_bump;

//clogging constant (blocking off an open column)

function getBestMove(){
    var candidates=[];
    var test=[];
    var x=0; //get minimum value for piece, if not 0,0 (I don't think this is necessary)
    var y=pieces[0].pos[1];
    var temp = new Piece([x,y], pieces[0].piecePos, "#B4B3B3", pieces[0].id);
    //duplicate piece and test all x values and rotations at lowest point, assign score and add to array - return highest score
    while((temp.id==4||temp.id==6)?(x<width):(temp.id==3)||(temp.id==2)||(temp.id==0)?(x<width-3):(x<width-1)){ //wow much bug (not lol)
        var r=0;
        while(r<4){
            y=pieces[0].pos[1];
            temp = new Piece([x,y], pieces[0].piecePos, "#B4B3B3", pieces[0].id);
            var free=true;
            while(free&&temp.pos[1]<(height-1)){
                temp.pos = [temp.pos[0], temp.pos[1]+1];
                free=freeY(temp);
            }
            //check conditions here and push to move candidate array
            //var ms=((c_holes*getHoles())+(c_height*getAggregateHeight())+(c_clear*getCompleteLines())+(c_low*temp.pos[1])); //calculate candidate overall score
            var l=getTempOccupiedSquares(temp);
            var gb=getGameBoard(l);
            //var ms=((getHoles(l))*c_holes)+(c_low*temp.pos[1])+(c_clear*getCompleteLines(l));
            var ms=((getHoles(gb)*c_holes)+(c_clear*getCompleteLines(gb))+/*(c_height*getAggregateHeight(gb))*/+(c_low*temp.pos[1])+(c_bump*getBumpiness(gb))+(c_clog*isClogging(temp.pos[0], gb, temp)));
            
            if(temp.id==1&&(r==2)&&(temp.pos[0]==13)){ms=-99999999999;} //DONT DO IT AGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH

            //AGGREGATE HEIGHT LAST 2 LINES NOT REALLY WORKING SDFISJFOJSEFIJDOSFJODSIJFOISDJFIO
            //DELTA HOLES?

            //test.push(getAggregateHeight(l));
            //debug(getAggregateHeight(l));
            //console.log((getAggregateHeight(l)));
            //most likely errors around here (ms), make sure to check b/c thats what it seems like
            //console.log(ms);
            candidates.push(new Candidate(temp.pos[0], r, ms));
            rotate();
            r++;
        }
        temp.pos=[temp.pos[0]+1, temp.pos[1]];
        x=temp.pos[0];
    }
    var highestCandidate=candidates[0];
    for(i=1;i<candidates.length;i++){
        //get best candidate
        (candidates[i].moveScore>highestCandidate.moveScore)&&(highestCandidate=candidates[i]);
    }
    for(i=0;i<highestCandidate.moveX;i++){ autoMoves.push(1); }
    for(i=0;i<highestCandidate.rotation;i++){ autoMoves.push(2); }
    autoMoves.push(3);
    //generate moves array for autoMove()
}

function autoMove(){
    if(autoMoves[0]==0){left();}
    else if(autoMoves[0]==1){right();}
    else if(autoMoves[0]==2){rotate();}
    else if(autoMoves[0]==3){quickDrop();}
    else if(autoMoves[0]==4){holdPiece();}
    autoMoves.shift();
}

//INIT
getBestMove();
var autoSpeed=10;

//   main game loop    //
function loop(){
    var now = Date.now();
    if(freeY(pieces[0])&&pieces[0].pos[1]>=2){
        if((now-start)>=autoSpeed){
            (auto&&autoMoves.length>0)&&(autoMove());
        }
        if((now-start)>=speed){
            calc=true;
            if(pieces[0].pos[1]<height-1){ //if it is above the floor
                free=freeY(pieces[0]);
                if(free){ //if it is above all other pieces
                    pieces[0].pos = [pieces[0].pos[0], pieces[0].pos[1]+1];
                } else{ //fix this PLEAZESRSEROSEIJFOSEIJFOISEJFOSIEJFOISEJFIO
                    pieces.unshift(queue.splice(0, 1)[0]);
                    queue.push(getRandomPiece());
                    rot=0;
                    free=true;
                    speed=gameSpeed;
                    hold=true;
                    (auto)&&getBestMove();
                }
            } else{
                pieces.unshift(queue.splice(0, 1)[0]);
                queue.push(getRandomPiece());
                rot=0;
                speed=gameSpeed;
                hold=true;
                (auto)&&getBestMove();
            }

            var r=getFullRows(getOccupiedSquares());
            if(r.length>0){ //if number of full rows is > 1 (at least one row is full)
                clearRows(r);
            }

            //console.log(getOccupiedSquares());
            start=Date.now();
        }
        draw(pieces, queue);
        window.requestAnimationFrame(loop);
        calc=false;
    } else{
        alert("Total Lines Cleared: "+totalClears);
        //location.reload();
    }
}

function left(){
    if(freeX(pieces[0])[1]){
        (pieces[0].pos = [pieces[0].pos[0]-1, pieces[0].pos[1]])
    }
}

function right(){
    if(freeX(pieces[0])[0]){
        (pieces[0].pos = [pieces[0].pos[0]+1, pieces[0].pos[1]])
    }
}

function rotate(){
    var temp=new Piece(pieces[0].pos, pieces[0].piecePos, pieces[0].color, pieces[0].id);
    rot++;
    if(rot%4==0){
        temp.piecePos = pieceList[temp.id];        
    } else if(rot%4==1){
        temp.piecePos = firstInv[temp.id];
    } else if (rot%4==2){
        temp.piecePos = secondInv[temp.id];
    } else if (rot%4==3){
        temp.piecePos = thirdInv[temp.id];
    }
    //debugger;
    if(freeRot(temp)){
        pieces[0]=new Piece(temp.pos, temp.piecePos, temp.color, temp.id);
    } else{
        r--;
    }
}

function quickDrop(){
    free=freeY(pieces[0])
    while(free&&pieces[0].pos[1]<(height-1)){
        pieces[0].pos = [pieces[0].pos[0], pieces[0].pos[1]+1];
        free=freeY(pieces[0]);
    }
    speed=1;
}

function holdPiece(){
    if(hold){
        var p = pieces[0];
        //pieces[0]=heldPiece;
        if(isEmpty(heldPiece)){
            pieces.splice(0,1);
            pieces.unshift(queue.splice(0, 1)[0]);
            queue.push(getRandomPiece());
        } else{
            pieces[0]=heldPiece;
        }
        heldPiece=new Piece([0,2], p.piecePos, p.color, p.id);
        hold=false;
    }
}

//handling keypresses
addEventListener("keydown", (event) => {
    if (event.isComposing || calc || auto) {
        return;
    }
    if(event.key=="ArrowLeft"){
        left();
     }//turn left
    if(event.key=="ArrowRight"){ 
        right();
     }//turn right
    if(event.key=="ArrowUp"){
        rotate();
    }//rotate piece clockwise
    if(event.key=="ArrowDown"){ 
        speed=1;
    }//rotate piece clockwise
    if(event.key==" "){
        quickDrop();
    }//quick drop
    if(event.key=="c"){
        holdPiece();
    }//hold piece
});

addEventListener("keyup", (event) => {
    if (event.isComposing || calc) {
        return;
    }
    if(event.key=="ArrowDown"){ 
        speed=gameSpeed;
    }
});


// var test = new Piece([2,2], pieceList[0], "#F06292");
// test.pos = [0,0];
// test.pos = [4,4];

window.requestAnimationFrame(loop)
