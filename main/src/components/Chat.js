/*global chrome*/
import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase-config";
import PlaybackTools from "./PlaybackTools";
import Header from "./Header";

export const Chat = (props) => {
  //Props
  const { lastResetTimestamp, sign_out, session } = props;
  //Destructure session prop
  const { path: roomPath, roomName, displayName: name } = session;

  const msgsRef = collection(db, `${roomPath}/msgs`);
  const roomRef = doc(db, roomPath);
  //firebase reference for messages for specific room

  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [incomingMsg, setIncomingMsg] = useState(null);

  //states for settings panel, message box, and message list

  // async function autoScroll() {
  //   const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  //   //delay used for moving scrollbar down
  //   let objDiv = document.getElementById("msg_box"); //ID NEEDS RENAMING Message list element
  //   if (objDiv.scrollTop >= 0) {
  //     await delay(100);
  //     objDiv.scrollTop = objDiv.scrollHeight;
  //   }
  // }

  useEffect(() => {
    const initialFetch = async () => {
      console.log("Fetching all since ", lastResetTimestamp);
      const q = query(
        msgsRef,
        orderBy("createdAt", "desc"),
        where("createdAt", ">=", lastResetTimestamp)
      );
      const querySnapshot = await getDocs(q);
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      if (msgs.length > 0) {
        chrome.storage.local.set({ messages: msgs });
        setMessages(msgs);
      }
    };

    const fetchMissed = async (lastTimestamp, cachedMessages) => {
      const q = query(
        msgsRef,
        orderBy("createdAt", "asc"),
        where("sender", "!=", name),
        where("createdAt", ">", lastTimestamp)
      );
      const querySnapshot = await getDocs(q);
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        newMessages.unshift({ id: doc.id, ...doc.data() });
      });

      if (newMessages.length > 0) {
        const updatedMessages = [...newMessages, ...cachedMessages];
        chrome.storage.local.set({ messages: updatedMessages });
        setMessages(updatedMessages);
      }
    };

    const roomRef = doc(db, roomPath);
    // Listen for the video time from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "currentTime") {
        console.log("Current video time received:", message.currentTime);

        // Send the time to Firestore
        updateDoc(roomRef, {
          currentTime: message.currentTime,
          state: "sync",
        });
      }
    });

    // Initialize workflow
    chrome.storage.local.get("messages").then((result) => {
      const cachedMessages = result.messages || [];
      setMessages(cachedMessages);

      if (cachedMessages.length > 0) {
        console.log("Cache", cachedMessages);
        // Use last cached message timestamp
        const lastTime = cachedMessages[0].createdAt;
        const lastTimestamp = new Timestamp(
          lastTime.seconds,
          lastTime.nanoseconds
        );
        fetchMissed(lastTimestamp, cachedMessages);
      } else {
        // If no cache, perform initial fetch
        initialFetch();
      }
    });
    const q = query(
      msgsRef,
      where("sender", "!=", name),
      where("createdAt", ">=", Timestamp.now()),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.size > 0) {
        const doc = snapshot.docs[0];
        setIncomingMsg({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (incomingMsg) {
      const lastRecieved = messages.findIndex((msg) => msg.name !== name);
      if (lastRecieved === -1 || messages[lastRecieved].id !== incomingMsg.id) {
        console.log("Live fetch ", incomingMsg);
        setMessages([incomingMsg, ...messages]);
        chrome.storage.local.set({ messages: [incomingMsg, ...messages] });
      }
    }
  }, [incomingMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage === "") return;

    const newDoc = await addDoc(msgsRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      sender: name,
    });
    setNewMessage("");
    const timestamp = Timestamp.now();
    setMessages([
      { id: newDoc.id, text: newMessage, sender: name, createdAt: timestamp },
      ...messages,
    ]);
    let objDiv = document.getElementById("msg_box");
    objDiv.scrollTop = objDiv.scrollHeight;
    chrome.storage.local.set({
      messages: [
        {
          id: newDoc.id,
          sender: name,
          text: newMessage,
          createdAt: timestamp,
        },
        ...messages,
      ],
    });
  };
  //adds new message to db and to message list, scrolls page down and resets text field

  const leaveRoomClick = (e) => {
    e.preventDefault();
    chrome.storage.local.remove("messages");
    sign_out();
  };
  //deletes messages from db and leaves room/deletes cookie

  const isUser = (msg_user) => {
    return msg_user === name;
  };
  const showName = (msg_name, index) => {
    if (index === messages.length) return true;
    return msg_name !== messages[index + 1]?.sender;
  };
  //determines id of name label which determines its color

  return (
    <div className="content-center items-center border-none flex flex-col h-full overflow-hidden">
      <Header title={roomName} inRoom={true} leaveRoomClick={leaveRoomClick}>
        <PlaybackTools roomRef={roomRef} />
      </Header>
      <div className="messages-box scrollbar" id="msg_box">
        {messages.map((message, index) => {
          const isMe = isUser(message.sender);
          const topMessage = showName(message.sender, index);
          return (
            <div
              className={`
                ${isMe ? "justify-end" : "justify-start"} 
                text-wrap break-normal text-white flex w-full items-center`}
              key={message.id}
            >
              <div
                className={`${topMessage && "mt-2"} ${
                  isMe && "items-end"
                } flex flex-col text-xs`}
              >
                <div
                  className={`${isMe ? "mr-2" : "ml-2"} ${
                    topMessage && "mb-1"
                  } font-medium`}
                >
                  {topMessage && message.sender}
                </div>
                <div
                  className={`${
                    isMe ? "flex-row" : "flex-row-reverse"
                  } flex items-center gap-x-1 group`}
                >
                  <div className="hidden group-hover:inline text-white h-fit bg-zinc-700 px-1 text-[10px] rounded-full">
                    {new Date(
                      message.createdAt.seconds * 1000
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </div>
                  <div
                    className={`
                      ${isMe ? "text-[greenyellow]" : "text-[plum]"}
                       bg-black text-base max-w-[75vw] break-words px-3 py-1 rounded-2xl font-sans-serif`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="w-full flex bg-black border-t border-white items-center p-2.5"
        onSubmit={handleSubmit}
      >
        <input
          className="bg-black text-base text-white outline-none mr-2 flex-1"
          placeholder="Enter message..."
          onChange={(e) => setNewMessage(e.target.value)}
          value={newMessage}
        />
        <button
          className="btn-primary w-16"
          type="submit"
          onClick={handleSubmit}
        >
          Send
        </button>
      </form>
    </div>
  );
};
