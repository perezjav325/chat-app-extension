import { useEffect, useState } from "react";
import { writeBatch, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, limit, getDocs, } from 'firebase/firestore';
import { db } from "../firebase-config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faRightFromBracket, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import '../styles/Chat.css';
import { cookies } from "../App";
import { set } from "firebase/database";

export const Chat = (props) => {
    const { room } = props;
    const { name } = props;
    const { sign_out } = props;
    const { roomRef } = props;
    
   
    const msgsRef = collection(db, `rooms/${room}/msgs`);
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState([]);
    let x = [];

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const [settings, setSettings] = useState("none");
    const queryMessages = query(msgsRef, where("name", "!=", name), orderBy("createdAt", "desc"), limit(1));
    useEffect( () => {
        const unsubscribe = onSnapshot(queryMessages, async (snapshot) => {
                const doc = snapshot.docs[0];
                
                if(doc.data().createdAt == null){return;}
                if(!x.includes(doc)){
                    x.unshift({ ...doc.data(), id: doc.id });
                }
            // snapshot.forEach((doc) => {
            //     msgs.push({ ...doc.data(), id: doc.id })
            // });
            var objDiv = document.getElementById("msg_box");
            if (objDiv.scrollTop >= 0) {
                setMessages(x);
                await delay(100);
                objDiv.scrollTop = objDiv.scrollHeight;
            }
            else {  setMessages(x); }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    async function deleteCollection(db, collectionPath, batchSize) {
        const collectionRef = collection(db,collectionPath);
        const delQuery = query(collectionRef, orderBy('__name__'), limit(batchSize));
      
        return new Promise((resolve, reject) => {
          deleteQueryBatch(db, delQuery, resolve).catch(reject);
        });
      }

      async function deleteQueryBatch(db, delQuery, resolve) {
        const snapshot = await getDocs(delQuery);
      
        const batchSize = snapshot.size;
        if (batchSize === 0) {
          // When there are no documents left, we are done
          resolve();
          return;
        }

          // Delete documents in a batch
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

}


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newMessage === "") return;

        await addDoc(msgsRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            name,
            room
        });
        messages.unshift({name: name, text: newMessage});
        var objDiv = document.getElementById("msg_box");
        objDiv.scrollTop = objDiv.scrollHeight;

        setNewMessage("");
    };

    const settingsClick = () => {
        console.log(x);
        if (settings === "main") { setSettings("none"); }
        else { setSettings("main"); }
    }

    const leaveRoomClick = (e) => {
        e.preventDefault();
        deleteCollection(db, "rooms/"+room+"/msgs", 100);
        sign_out();
    }

    const confirmUser = (msg_user) => {
        if (msg_user == name) { return "self"; }
        else return "other";
    }


    return (
        <div className="chat-app">
            {settings === "none" ?
                <div className="form-header">
                    <FontAwesomeIcon onClick={settingsClick} className="gear-icon" icon={faGear} />
                    <FontAwesomeIcon onClick={leaveRoomClick} className="leave-room-button" icon={faRightFromBracket} flip="horizontal" />
                    <h1>{room}</h1>
                </div> : <div className="form-header" id={settings}>
                    <div className="settings-top">
                        Settings
                        <FontAwesomeIcon onClick={settingsClick} className="caret-up" icon={faCaretUp} />
                    </div>
                    <div className="settings-content">Settings Go Here</div>
                </div>
            }
            <div className="messages" id="msg_box">
                {messages.map((message) => (
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