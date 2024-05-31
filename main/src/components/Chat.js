import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, limit} from 'firebase/firestore';
import { auth, db } from "../firebase-config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import '../styles/Chat.css';

export const Chat = (props) => {
    const {room} = props;
    const {name} = props;
    const {sign_out} = props;

    const messagesRef = collection(db, "messages");
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const delay = ms => new Promise(res => setTimeout(res, ms));
    

    useEffect(() => {
        const queryMessages = query(messagesRef, where("room", "==", room), orderBy("createdAt", "desc"), limit(100) );
        const unsubscribe = onSnapshot(queryMessages, async (snapshot) =>{
            let msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({...doc.data(), id: doc.id })
            });
            var objDiv = document.getElementById("msg_box");
            if(objDiv.scrollTop >= 0){
                setMessages(msgs);
                await delay(100);
                objDiv.scrollTop = objDiv.scrollHeight;
            }
            else{setMessages(msgs);}
        });
        return () => {
            unsubscribe();
        };
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if(newMessage === "") return;

        await addDoc(messagesRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            name,
            room,
        });
        var objDiv = document.getElementById("msg_box");
        objDiv.scrollTop = objDiv.scrollHeight;

        setNewMessage("");
    };

    const settingsClick = (e) => {
        e.preventDefault();
    }

    const leaveRoomClick = (e) => {
        e.preventDefault();
        sign_out(auth);
    }

    const confirmUser = (msg_user) => {
        if(msg_user == name){return "self";}
        else return "other";
    }
    

    return (
        <div className="chat-app">
        <div className="header">
        <FontAwesomeIcon onClick={settingsClick} className="gear-icon" icon={faGear}/>
        <FontAwesomeIcon onClick={leaveRoomClick} className="leave-room-button" icon={faRightFromBracket} flip="horizontal" />
        <h1>{room}</h1>
        </div>
        <div className="messages" id="msg_box"> 
        {messages.map((message)=> (
            <div className="message" key={message.id}>
            <span className="user" id={confirmUser(message.name)}>{message.name} :</span>
            {message.text}
            </div>
            ))}
        </div>
        <form className="new-message-form" onSubmit={handleSubmit}>
            <input 
            className="new-message-input" 
            placeholder="Enter message..."
            onChange={(e) => setNewMessage(e.target.value)}
            value={newMessage}
            />
            <button className="send-button" type="submit">
                Send
            </button>
        </form> 
        </div>
    );
};