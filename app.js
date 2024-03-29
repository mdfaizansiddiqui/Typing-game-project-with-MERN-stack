const express=require('express');
const app=express();
// const http=require('http');
const socketio=require('socket.io');
const mongoose=require('mongoose');
const port = process.env.PORT || 3001;
// const expressServer=app.listen(3001);
const server=app.listen(port,()=>console.log(`listening onn port ${port}`));
const io=socketio(server,{
    cors:{
        origin:'http://localhost:3000'
    }
});
const Game=require('./Models/Game');
const QuotableAPI=require('./QuotableAPI');
const { findById } = require('./Models/Game');
mongoose.connect('mongodb+srv://playerDb:3926341@app-db.mqwfr.mongodb.net/app-db?retryWrites=true&w=majority',{useNewUrlParser:true,useUnifiedTopology:true},()=>{console.log("DB Connected")});
io.on('connect',(socket)=>{

    socket.on('userInput',async({userInput,gameID})=>{
        try{
            let game= await Game.findById(gameID);
            if(!game.isOpen && !game.isOver){
                let player =game.players.find(player=>player.socketID===socket.id);
                let word = game.words[player.currentWordIndex];
                if(word===userInput){
                    player.currentWordIndex++;
                    if(player.currentWordIndex!==game.words.length){
                        game=await game.save();
                        io.to(gameID).emit("updateGame",game);
                    }

                    else{
                        let endTime=new Date().getTime();
                        let {startTime}=game;
                        player.WPM=calculateWPM(endTime,startTime,player);
                        game=await game.save();
                        socket.emit('done');
                        io.to(gameID).emit('updateGame',game);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    })


    socket.on('timer',async ({gameID,playerID})=>{
        let countDown=5;
        let game=await Game.findById(gameID);
        let player=game.players.id(playerID);//to chech which player has made the request
        if(player.isPartyLeader){
            let timerID = setInterval(async ()=>{
                if(countDown>=0){
                    io.to(gameID).emit('timer',{countDown,msg:"Starting Game"});
                    countDown--;
                }

                else{
                    game.isOpen=false;
                    game=await game.save();
                    io.to(gameID).emit('updateGame',game);
                    startGameClock(gameID);
                    clearInterval(timerID);
                }
            },1000);
        }
    });


    socket.on('join-game',async ({gameID:_id,nickName})=>{
        try{
            let game=await Game.findById(_id);
            if(game.isOpen){
                const gameID=game._id.toString();
                socket.join(gameID);
                let player={
                    socketID:socket.id,
                    nickName
                }
                game.players.push(player);
                game=await game.save();
                io.to(gameID).emit('updateGame',game);
            }
        }catch(err){
            console.log(err);
        }
    })


    socket.on('create-game',async (nickName)=>{
        try{
            const quotableData=await QuotableAPI();
            let game =new Game();//creating object of the database model and insert values using the model schema
            game.words=quotableData;
            // game.words.push("sjanj");
            // game.words.push("FUCK OFF");
            let player={//creating each player
                socketID : socket.id,
                isPartyLeader:true,
                nickName
            }
            game.players.push(player);
            game=await game.save();
            const gameID=game._id.toString();
            socket.join(gameID);
            io.to(gameID).emit('updateGame',game);
        }
        catch(err){
            console.log(err);
        }
    });
});

const startGameClock = async (gameID)=>{
    let game =await Game.findById(gameID);
    game.startTime = new Date().getTime();
    game= await game.save();
    let time = 5;
    let timerID=setInterval(function gameIntervalFunc(){
        
        if(time>=0){
            const formatTime=calculateTime(time);
            io.to(gameID).emit('timer',{countDown:formatTime,msg:"Time Remaining"});
            time--;
        }
        else{
            (async ()=>{
                let endTime=new Date().getTime();
                let game= await Game.findById(gameID);
                let {startTime} = game;
                game.isOver=true;
                game.players.forEach((player,index)=>{
                    if(player.WPM===-1) game.players[index].WPM=calculateWPM(endTime,startTime,player);
                });
                game = await game.save();
                io.to(gameID).emit('updateGame',game);
                clearInterval(timerID);
            })();
        }
       return gameIntervalFunc;
    }(),1000)
}

const calculateTime=(time)=>{
    let minutes = Math.floor(time/60);
    let seconds = time%60;

    return `${minutes}:${seconds<10?"0"+seconds:seconds}`;
}

const calculateWPM = (endTime,startTime,player)=>{
    let numOfWords=player.currentWordIndex;
    const timeInSeconds = (endTime-startTime)/1000;
    const timeInMinutes=timeInSeconds/60;
    const WPM=Math.floor(numOfWords/timeInMinutes);
    return WPM;
}