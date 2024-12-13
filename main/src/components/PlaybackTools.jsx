/*global chrome*/
import React, { useState, useRef, useEffect } from "react";
import { updateDoc, onSnapshot } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faPlay,
  faRotate,
  faBackwardFast,
} from "@fortawesome/free-solid-svg-icons";

const PlaybackTools = ({ roomRef }) => {
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const intervalIdRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (isPlaying) {
      intervalIdRef.current = setInterval(() => {
        console.log("tick");
        setPlaybackTime(Date.now() - startTimeRef.current);
      }, 1000);
    }
    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const timeSync = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log("Sync update from Firestore:", data);

        if (data.state === "sync") {
          // Adjust follower's playback to match the leader
          chrome.runtime.connect({ name: "sidebar" }).postMessage({
            action: "adjustPlayback",
            currentTime: data.currentTime,
          });
          setPlaybackTime(data.currentTime);
        }
        if (data.state === "play") {
          chrome.runtime.connect({ name: "sidebar" }).postMessage({
            action: "playbackCommand",
            state: "play",
          });
          setIsPlaying(true);
        }
        if (data.state === "pause") {
          chrome.runtime.connect({ name: "sidebar" }).postMessage({
            action: "playbackCommand",
            state: "pause",
          });
          setIsPlaying(false);
        }
      }
    });

    return () => timeSync();
  }, []);

  const formatTime = () => {
    let hours = Math.floor(playbackTime / (1000 * 60 * 60));
    let minutes = Math.floor((playbackTime / (1000 * 60)) % 60);
    let seconds = Math.floor((playbackTime / 1000) % 60);
    // let millis = Math.floor((elapsedTime % 1000) / 10);

    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  // Function to send the current video time to Firestore
  const syncVideoTime = () => {
    chrome.runtime
      .connect({ name: "sidebar" })
      .postMessage({ action: "getCurrentTime" });
  };

  const restartVideoTime = () => {
    // Send the time 0 to Firestore
    updateDoc(roomRef, {
      currentTime: 0,
      state: "sync",
    });
  };

  // Function to send play or pause commands
  const sendCommand = async (command) => {
    const x = command ? "pause" : "play";
    chrome.runtime.connect({ name: "sidebar" }).postMessage({
      action: "playbackCommand",
      state: x,
    });
    // const roomRef = doc(db, roomPath);
    await updateDoc(roomRef, {
      state: x,
    });
    setIsPlaying(!command);
    if (command) syncVideoTime();
    else {
      startTimeRef.current = Date.now() - playbackTime;
    }
  };

  return (
    <div>
      <div className="text-white">{formatTime()}</div>
      <div className="flex flex-row items-center gap-x-2">
        <button
          title="Restart"
          className="btn-primary-circle size-5"
          onClick={() => restartVideoTime()}
        >
          <FontAwesomeIcon icon={faBackwardFast} color="black" />
        </button>
        <button
          title={isPlaying ? "Pause" : "Play"}
          className="btn-primary-circle size-8"
          onClick={() => sendCommand(isPlaying)}
        >
          {isPlaying ? (
            <FontAwesomeIcon icon={faPause} />
          ) : (
            <FontAwesomeIcon icon={faPlay} />
          )}
        </button>
        <button
          title="Sync"
          className="btn-primary-circle size-5"
          onClick={() => syncVideoTime()}
        >
          <FontAwesomeIcon icon={faRotate} color="black" />
        </button>
      </div>
    </div>
  );
};

export default PlaybackTools;
