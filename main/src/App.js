/*global chrome*/
import React, { useState, useRef, useEffect } from "react";
import Cookies from "universal-cookie";
import { Chat } from "./components/Chat";
import { db, checkIn, auth } from "./firebase-config";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  arrayUnion,
  updateDoc,
  arrayRemove,
  getDoc,
  Timestamp,
  DocumentReference,
} from "firebase/firestore";
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
  const [createTab, setCreateTab] = useState(true);
  const checkCookie = () => {
    const cookie_values = cookies.get("sessionInfo");
    if (cookie_values) setSessionInfo(cookie_values);
  };
  const [sessionInfo, setSessionInfo] = useState({
    displayName: null,
    roomName: null,
    path: null,
  });
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [settings, setSettings] = useState(false);
  const [pin, setPin] = useState("0000");
  const [roomRef, setRoomRef] = useState(null);

  useEffect(() => {
    checkCookie();
  }, []);

  useEffect(() => {
    if (sessionInfo.path) setRoomRef(doc(db, sessionInfo.path));
  }, [sessionInfo.path]);

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

    await updateDoc(roomRef, {
      members: arrayRemove(auth.currentUser.uid),
    });

    const docRef = await getDoc(roomRef);
    if (docRef.data().members.length === 0) {
      updateDoc(roomRef, { isActive: false });
    }

    auth.currentUser.delete();
    cookies.remove("sesionInfo");
    cookies.remove("isInRoom");
    setIsInRoom(false);
    setSessionInfo({ displayName: null, roomName: null, path: null });
    setRoomRef(null);
  };

  const handleRoomEnter = async (room, name, pin) => {
    if (room === "" || name === "") {
      alert("Must enter a room name and display name");
      return;
    }

    const user = await checkIn();
    const roomsRef = collection(db, "rooms");
    const q = query(
      roomsRef,
      where("roomName", "==", room),
      where("pin", "==", parseInt(pin))
    );
    const roomSnapshot = await getDocs(q);
    let roomPath;
    if (createTab) {
      if (roomSnapshot.empty) {
        const newRoom = await addDoc(roomsRef, {
          roomName: room,
          pin: parseInt(pin),
          isActive: true,
          lastResetTimestamp: serverTimestamp(),
          members: [user.uid],
        });
        setLastTimestamp(Timestamp.now());
        setRoomRef(newRoom);

        cookies.set("RoomRef", newRoom);
        roomPath = newRoom.path;
      } else if (roomSnapshot.docs[0].data().isActive) {
        alert("Room already exists");
        return;
      } else {
        //update room
        await updateDoc(roomSnapshot.docs[0].ref, {
          isActive: true,
          lastResetTimestamp: serverTimestamp(),
          members: [user.uid],
        });
        setLastTimestamp(Timestamp.now());
        roomPath = roomSnapshot.docs[0].ref.path;
        setRoomRef(roomSnapshot.docs[0].ref);
      }
    } else {
      if (roomSnapshot.empty || !roomSnapshot.docs[0].data().isActive) {
        alert("Incorrect Room Name or Pin");
        return;
      } else {
        const room = roomSnapshot.docs[0].ref;
        roomPath = room.path;
        updateDoc(room, {
          members: arrayUnion(user.uid),
        });
        setRoomRef(room);
        setLastTimestamp(roomSnapshot.docs[0].data().lastResetTimestamp);
      }
    }
    chrome.storage.local.remove("messages");
    setSessionInfo({
      displayName: name,
      roomName: room,
      path: roomPath,
    });
    setIsInRoom(true);
    cookies.set("isInRoom", true);
    cookies.set("sessionInfo", {
      displayName: name,
      roomName: room,
      path: roomPath,
    });
  };

  const keyDownFunction = (e) => {
    if (e.key === "Enter") {
      handleRoomEnter(
        roomInputRef.current.value,
        nameInputRef.current.value,
        pin
      );
    }
  };

  const pinFunction = (e) => {
    // Prevent default behavior for non-numeric keys except Backspace
    if (!/^[0-9]$/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault();
      return;
    }

    // Handle the input
    setPin((prevPin) => {
      if (e.key === "Backspace") {
        // Remove the last digit or reset to "0000" if empty
        return prevPin.slice(0, -1).padStart(4, "0");
      }

      // Add the new digit and ensure the PIN is 4 characters long
      const newPin = prevPin.slice(1) + e.key;
      return newPin;
    });
  };

  const settingsClick = () => {
    console.log(sessionInfo);
    setSettings((prev) => !prev);
  };

  return (
    <div className="h-[100vh]">
      {isInRoom && sessionInfo.path ? (
        <Chat
          roomPath={sessionInfo.path}
          roomName={sessionInfo.roomName}
          lastResetTimestamp={lastTimestamp}
          name={sessionInfo.displayName}
          sign_out={signUserOut}
        />
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
          <div className="flex flex-col ml-3 mt-3 gap-y-3">
            <div className="w-full">
              <button
                onClick={() => setCreateTab(true)}
                className={`py-1 px-2 rounded-l-3xl w-1/2 border border-black font-semibold ${
                  createTab
                    ? "bg-[greenyellow]"
                    : "bg-zinc-600 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setCreateTab(false)}
                className={`py-1 px-2 rounded-r-3xl w-1/2 border border-black font-semibold ${
                  !createTab
                    ? "bg-[greenyellow]"
                    : "bg-zinc-600 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Join
              </button>
            </div>

            <div className="flex justify-between">
              <label className="font-semibold text-sm text-white">
                Display Name
              </label>
              <input
                maxLength={24}
                type="text"
                onKeyDown={keyDownFunction}
                ref={nameInputRef}
                className="input-info w-[50%]"
              />
            </div>

            <div className="flex justify-between">
              <label className="font-semibold text-sm text-white">
                Room Name
              </label>
              <input
                maxLength={24}
                type="text"
                onKeyDown={keyDownFunction}
                ref={roomInputRef}
                className="input-info w-[50%]"
              />
            </div>

            <div className="flex justify-between">
              <label className="font-semibold text-sm text-white">PIN</label>
              <div className="w-[50%] justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onKeyDown={pinFunction}
                  className="input-info w-[30%] text-center"
                />
              </div>
            </div>

            <button
              className="btn-primary w-fit self-center"
              onClick={() => {
                handleRoomEnter(
                  roomInputRef.current.value,
                  nameInputRef.current.value,
                  pin
                );
              }}
            >
              {createTab ? "Create Room" : "Join Room"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
