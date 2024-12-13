/*global chrome*/
import React, { useState, useRef } from "react";
import Cookies from "universal-cookie";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  arrayUnion,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db, checkIn } from "../firebase-config";
import Header from "./Header";
const cookies = new Cookies();

const MainPage = ({ setLastTimestamp, setSessionInfo, setIsInRoom }) => {
  const [createTab, setCreateTab] = useState(true);
  const [pin, setPin] = useState("0000");

  const roomInputRef = useRef(null);
  const nameInputRef = useRef(null);

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

  return (
    <div className="h-full bg-[#333] flex flex-col items-center">
      <Header title={"skibidi-chat"} />
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
          <label className="font-semibold text-sm text-white">Room Name</label>
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
  );
};

export default MainPage;
