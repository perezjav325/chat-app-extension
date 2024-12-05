/*global chrome*/
import { useEffect, useState } from "react";
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
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faRightFromBracket,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Chat.css";

export const Chat = (props) => {
  const { room } = props;
  const { name } = props;
  const { sign_out } = props;
  //Props

  const msgsRef = collection(db, `rooms/${room}/msgs`);
  //firebase reference for messages for specific room

  const [settings, setSettings] = useState(false);
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
      const q = query(msgsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      if (msgs.length > 0) {
        chrome.storage.local.set({ messages: msgs });
        setMessages(msgs);

        // Start the real-time listener with the latest timestamp
        const lastTime = msgs[0].createdAt;
      }
    };

    const fetchMissed = async (lastTimestamp, cachedMessages) => {
      const q = query(
        msgsRef,
        orderBy("createdAt", "asc"),
        startAfter(lastTimestamp)
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

        // Update lastTimestamp
        const lastTime = newMessages[newMessages.length - 1].createdAt;
      }
    };

    // Initialize workflow
    chrome.storage.local.get("messages").then((result) => {
      const cachedMessages = result.messages || [];
      setMessages(cachedMessages);

      if (cachedMessages.length > 0) {
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
      where("name", "!=", name),
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
      console.log(lastRecieved);
      if (lastRecieved === -1 || messages[lastRecieved].id !== incomingMsg.id) {
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
      name,
      room,
    });
    setNewMessage("");
    const timestamp = Timestamp.now();
    setMessages([
      { id: newDoc.id, text: newMessage, name: name, createdAt: timestamp },
      ...messages,
    ]);
    let objDiv = document.getElementById("msg_box"); //ID NEEDS RENAMING
    objDiv.scrollTop = objDiv.scrollHeight;
    chrome.storage.local.set({
      messages: [
        {
          id: newDoc.id,
          name: name,
          text: newMessage,
          createdAt: timestamp,
        },
        ...messages,
      ],
    });
  };
  //adds new message to db and to message list, scrolls page down and resets text field

  const settingsClick = () => {
    setSettings((prev) => !prev);
  };
  //opens and closes settings panel

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
    return msg_name !== messages[index + 1]?.name;
  };
  //determines id of name label which determines its color

  return (
    <div className="content-center items-center border-none flex flex-col h-full overflow-hidden">
      {!settings ? (
        <div className="header">
          <div className="w-full flex flex-row justify-end gap-2">
            <FontAwesomeIcon
              onClick={settingsClick}
              className="text-base hover:text-[greenyellow]"
              icon={faGear}
            />
            <FontAwesomeIcon
              onClick={leaveRoomClick}
              className="text-base hover:text-red-600"
              icon={faRightFromBracket}
            />
          </div>
          <h1 className="text-[greenyellow] font-bold text-2xl">{room}</h1>
        </div>
      ) : (
        <div className="header" id={settings}>
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
      <div className="messages-box scrollbar" id="msg_box">
        {messages.map((message, index) => {
          const isMe = isUser(message.name);
          const topMessage = showName(message.name, index);
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
                <div className={`${isMe ? "mr-2" : "ml-2"} font-medium `}>
                  {topMessage && message.name}
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
