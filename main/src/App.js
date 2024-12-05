/*global chrome*/
import React, { useState, useRef } from "react";
import Cookies from "universal-cookie";
import { Chat } from "./components/Chat";
import { db, checkIn } from "./firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faCaretUp } from "@fortawesome/free-solid-svg-icons";
// import { deleteCollection } from "./components/Deletion";
// import {
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   setDoc,
//   updateDoc,
// } from "firebase/firestore";

export const cookies = new Cookies();

function App() {
  const [isInRoom, setIsInRoom] = useState(cookies.get("isInRoom"));
  const checkCookie = (index) => {
    var cookie_values = cookies.get("user-room");
    if (cookie_values != null) {
      cookie_values = cookie_values.split("-");
    }
    if (isInRoom) return cookie_values[index];
    else return null;
  };

  const [room, setRoom] = useState(checkCookie(1));
  const [name, setName] = useState(checkCookie(0));
  // const roomsRef = collection(db, "rooms");

  const [settings, setSettings] = useState(false);

  const roomInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const signUserOut = async () => {
    // const docRef = doc(db, "rooms", room);
    // const currentUsers = (await getDoc(docRef)).data().users;
    // if (currentUsers === 1) {
    //   deleteCollection(db, "rooms/" + room + "/msgs", 100);
    //   await deleteDoc(doc(db, "rooms", room));
    // } else {
    //   await updateDoc(docRef, { users: currentUsers - 1 });
    // }

    cookies.remove("user-room");
    cookies.remove("isInRoom");
    setIsInRoom(false);
    setRoom(null);
  };

  const enterRoom = async () => {
    if (roomInputRef.current.value === "" || nameInputRef.current.value === "")
      return;
    checkIn();
    const roomRef = doc(db, "rooms", roomInputRef.current.value);
    await setDoc(roomRef, {});
    setRoom(roomInputRef.current.value);
    setName(nameInputRef.current.value);
    setIsInRoom(true);
    cookies.set("isInRoom", true);
    cookies.set(
      "user-room",
      nameInputRef.current.value + "-" + roomInputRef.current.value
    );
  };

  const keyDownFunction = (e) => {
    if (e.key === "Enter") {
      enterRoom();
    }
  };

  const settingsClick = () => {
    setSettings((prev) => !prev);
  };

  return (
    <div className="h-[100vh]">
      {isInRoom ? (
        <Chat room={room} name={name} sign_out={signUserOut} />
      ) : (
        <div className="h-full bg-[#333] flex flex-col items-center">
          {!settings ? (
            <div className="header">
              <FontAwesomeIcon
                onClick={settingsClick}
                className="text-base self-end text-white hover:text-[greenyellow]"
                icon={faGear}
              />
              <h1 className="text-[greenyellow] font-bold text-2xl">
                skibidi-chat
              </h1>
            </div>
          ) : (
            <div className="header">
              <div className="font-bold text-center flex gap-x-2">
                Settings
                <FontAwesomeIcon
                  onClick={settingsClick}
                  className="text-base self-end hover:text-[greenyellow]"
                  icon={faCaretUp}
                />
              </div>
              <div className="text-center text-white">Settings Go Here</div>
            </div>
          )}
          <div className="self-start flex flex-col max-w-[33%] ml-3 mt-3 gap-y-3">
            <div className="flex flex-col">
              <label className="mb-1.5 font-semibold text-sm text-white">
                Display Name
              </label>
              <input
                maxLength={16}
                type="text"
                onKeyDown={keyDownFunction}
                ref={nameInputRef}
                className="input-info"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1.5 font-semibold text-sm text-white">
                Room Name
              </label>
              <input
                maxLength={16}
                type="text"
                onKeyDown={keyDownFunction}
                ref={roomInputRef}
                className="input-info"
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                enterRoom();
              }}
            >
              Enter Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
