import {useHistory } from 'react-router-dom';
const GameMenu=props=>{
    let history=useHistory();
    return(
        <div className="text-center">
            <h1>Welcome to type racer</h1>
            <button type="button" onClick={()=> history.push('/game/create')} className="btn btn-primary btn-lg mr-3">Create Game</button>
            <button type="button" onClick={()=> history.push('/game/join')} className="btn btn-primary btn-lg">Join Game</button>


        </div>
    )
}

export default GameMenu;