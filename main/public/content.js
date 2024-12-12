/*global chrome*/

// const attachListeners = () => {
//   const videoElement = document.querySelector("video");
//   if (videoElement && !videoElement.hasListener) {
//     console.log("Attaching listeners to video element");

//     // Send state change to the background service worker
//     const sendState = (state, time) => {
//       chrome.runtime.sendMessage({
//         action: "videoStateChange",
//         state,
//         currentTime: time,
//       });
//     };

//     // Attach key listeners
//     videoElement.addEventListener("play", () => {
//       sendState("play", videoElement.currentTime);
//     });

//     videoElement.addEventListener("pause", () => {
//       sendState("pause", videoElement.currentTime);
//     });

//     videoElement.addEventListener("seeked", () => {
//       sendState("seeked", videoElement.currentTime);
//     });

//     videoElement.hasListener = true; // Prevent reattaching
//   }
// };

// // Use MutationObserver for dynamic DOM changes
// const observer = new MutationObserver(attachListeners);
// observer.observe(document.body, { childList: true, subtree: true });

// // Initial listener attachment
// attachListeners();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const videoElement = document.querySelector("video");
  if (message.action === "playbackCommand") {
    if (!videoElement) {
      console.error("No video element found on the page!");
      return;
    }

    if (message.state === "play") {
      videoElement.play();
    } else if (message.state === "pause") {
      videoElement.pause();
    }
  }
  if (message.action === "getCurrentTime") {
    if (!videoElement) {
      console.error("No video element found on the page!");
      return;
    }

    // Send the current playback time back to the sidebar
    chrome.runtime.sendMessage({
      action: "currentTime",
      currentTime: videoElement.currentTime * 1000,
    });
  }
  if (message.action === "adjustPlayback") {
    // const now = Date.now();
    // const latency = (now - message.timestamp) / 1000; // Latency in seconds
    const adjustedTime = message.currentTime / 1000; // Adjust for delay

    if (videoElement) {
      videoElement.currentTime = adjustedTime; // Sync time
      //   videoElement.play(); // Start playback
    }
  }
});
