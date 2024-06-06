import React, { useState, useRef } from "react";
import './styles/App.css';
import Cookies from 'universal-cookie';
import { Chat } from "./components/Chat";
import { db } from "./firebase-config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
export const cookies = new Cookies();


function App() {
  const [isInRoom, setIsInRoom] = useState(cookies.get("user-room"));
  const checkCookie = (index) => {
    var cookie_values = cookies.get("user-room");
    if (cookie_values != null) { cookie_values = cookie_values.split("-"); }
    if (isInRoom) return cookie_values[index];
    else return null;
  }

  const [room, setRoom] = useState(checkCookie(1));
  const [name, setName] = useState(checkCookie(0));
  const roomsRef = collection(db, "rooms");
  const [roomRef, setRoomRef] = useState(cookies.get("roomRef"));

  const [settings, setSettings] = useState("none");

  const roomInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const signUserOut = async () => {
    await deleteDoc(doc(db,"rooms",room));
    cookies.remove("user-room");
    setIsInRoom(false);
    setRoom(null);
  }

  const enterRoom = async() => {
    if (roomInputRef.current.value == "" || nameInputRef.current.value == "") return;
    setRoomRef(doc(db, "rooms", roomInputRef.current.value));
    const docRef = doc(db,"rooms", roomInputRef.current.value);
    if((await getDoc(docRef)).exists){
      console.log("EXISTS");
    }
    await setDoc(doc(roomsRef, roomInputRef.current.value),{});
    setRoom(roomInputRef.current.value);
    setName(nameInputRef.current.value);
    setIsInRoom(true);
    cookies.set("roomRef", roomRef);
    cookies.set("user-room", nameInputRef.current.value + "-" + roomInputRef.current.value);
  }

  const keyDownFunction = (e) => {
    if (e.key === 'Enter') {
      enterRoom();
    }
  }

  const settingsClick = () => {
    if (settings === "main") { setSettings("none"); }
    else { setSettings("main"); }
  }

  return <div>
    {isInRoom ? <Chat room={room} name={name} roomRef={roomRef} sign_out={signUserOut} /> :

      <div className="form">
        {settings === "none" ?
          <div className="form-header">
            <FontAwesomeIcon onClick={settingsClick} className="gear-icon" icon={faGear} />
            <h1>skibidi-chat</h1>
          </div>
          : <div className="form-header" id={settings}>
            <div className="settings-top">
              Settings
              <FontAwesomeIcon onClick={settingsClick} className="caret-up" icon={faCaretUp} />
            </div>
            <div className="settings-content">Settings Go Here</div>
          </div>}
        <div className="entry-form">
          <label className="name-label">Display Name</label>
          <input maxLength={16} type="text" onKeyDown={keyDownFunction} ref={nameInputRef} />
        </div>

        <div className="entry-form">
          <label className="name-label">Room Name</label>
          <input maxLength={16} type="text" onKeyDown={keyDownFunction} ref={roomInputRef} />
        </div>

        <button
          className="enter-button"
          onClick={() => { enterRoom(); }}
        >Enter Room
        </button>
      </div>
    }
  </div>

}

export default App;