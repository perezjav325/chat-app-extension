/*global chrome*/
import React, { useState, useEffect } from "react";
import Cookies from "universal-cookie";
import { Chat } from "./components/Chat";
import { db, auth } from "./firebase-config";
import { doc, updateDoc, arrayRemove, getDoc } from "firebase/firestore";
import MainPage from "./components/MainPage";
export const cookies = new Cookies();

function App() {
  const [isInRoom, setIsInRoom] = useState(cookies.get("isInRoom"));
  const [sessionInfo, setSessionInfo] = useState({
    displayName: null,
    roomName: null,
    path: null,
  });
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [roomRef, setRoomRef] = useState(null);

  const checkCookie = () => {
    const cookie_values = cookies.get("sessionInfo");
    if (cookie_values) setSessionInfo(cookie_values);
  };

  useEffect(() => {
    checkCookie();
  }, []);

  useEffect(() => {
    if (sessionInfo.path) setRoomRef(doc(db, sessionInfo.path));
  }, [sessionInfo.path]);

  const signUserOut = async () => {
    await updateDoc(roomRef, {
      members: arrayRemove(auth.currentUser.uid),
    });

    const docRef = await getDoc(roomRef);
    if (docRef.data().members.length === 0) {
      updateDoc(roomRef, { isActive: false, currentTime: 0, state: "sync" });
    }

    auth.currentUser.delete();
    cookies.remove("sesionInfo");
    cookies.remove("isInRoom");
    setIsInRoom(false);
    setSessionInfo({ displayName: null, roomName: null, path: null });
    setRoomRef(null);
  };

  return (
    <div className="h-[100vh]">
      {isInRoom && sessionInfo.path ? (
        <Chat
          session={sessionInfo}
          lastResetTimestamp={lastTimestamp}
          sign_out={signUserOut}
        />
      ) : (
        <MainPage
          setIsInRoom={setIsInRoom}
          setLastTimestamp={setLastTimestamp}
          setSessionInfo={setSessionInfo}
        />
      )}
    </div>
  );
}

export default App;
