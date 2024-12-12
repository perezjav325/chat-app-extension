/*global chrome*/
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "videoStateChange") {
//     console.log("Video state change:", message);

//     // Save the latest state in chrome.storage
//     chrome.storage.local.set({
//       videoState: {
//         state: message.state,
//         currentTime: message.currentTime,
//       },
//     });

//     sendResponse({ status: "State saved" });
//   }
// });

// // Optional: Handle sidebar connections to relay the latest state immediately
// chrome.runtime.onConnect.addListener((port) => {
//   if (port.name === "sidebar") {
//     console.log("Sidebar connected");

//     // Send the latest state to the sidebar on connection
//     chrome.storage.local.get("videoState", (result) => {
//       if (result.videoState) {
//         port.postMessage(result.videoState);
//       }
//     });

//     // Handle potential disconnection
//     port.onDisconnect.addListener(() => {
//       console.log("Sidebar disconnected");
//     });
//   }
// });

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
// });

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidebar") {
    port.onMessage.addListener((message) => {
      if (message.action === "playbackCommand") {
        // Relay the command to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "playbackCommand",
              state: message.state,
            });
          }
        });
      }
      if (message.action === "getCurrentTime") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getCurrentTime" });
          }
        });
      }
      if (message.action === "adjustPlayback") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "adjustPlayback",
              currentTime: message.currentTime,
            });
          }
        });
      }
    });
  }
});
