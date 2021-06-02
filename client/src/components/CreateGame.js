import {useState} from 'react';
import socket from '../socketConfig';

const CreateGame=props=>{
    const [nickName,setNickName]=useState("");
    const onChange=e=>{
        setNickName(e.target.value);
    }

    const onSubmit=e=>{
        e.preventDefault();
        socket.emit('create-game',nickName);
    }
    return(
        <div className="row">
            <div className="col-sm"></div>
            <div className="col-sm-8">
                <h1 className="text-center">Create Game</h1>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="nickName">Enter nickame</label>
                        <input type="text" name="nickName" value={nickName} onChange={onChange} placeholder="enter nick name" className="form-control" />
                    </div>
                    <button type="submit" className="btn btn-primary">submit</button>
                </form>
            </div>
            <div className="col-sm"></div>
        </div>
    )
}

export default CreateGame;