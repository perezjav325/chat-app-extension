
// import { db } from './firebase.js'
// import { collection, onSnapshot, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

// let room = null;
// let name = null;
// let msgsRef = null;
// let queryMessages = null;
// let unsubscribe = ()=>{};

// addEventListener("message", (event) => {
//   if(event.data == false){
//     unsubscribe();
//     console.log("QUIT"); 
//     return;
//   }
    
//   const info = event.data;
//   room = info.room;
//   name = info.name;
//   msgsRef = collection(db, `rooms/${room}/msgs`);
//   queryMessages = query(msgsRef, where("name", "!=", name), orderBy("createdAt", "desc"), limit(1));
//   unsubscribe = onSnapshot(queryMessages, (snapshot) => {
//     if(snapshot.size == 0) return;
//     const doc = snapshot.docs[0]; //document object of newest msg
//     const channel = new BroadcastChannel('sw-messages');
//     channel.postMessage({...doc.data(), id: doc.id});
//   }); 
// });


chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });

  