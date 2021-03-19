let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
}; // pending is a new table in the budget database

request.onsuccess = function(event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) { //if not connected to the database for some reason, make sure to save the data to the indexDb
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to your store with add method.
  store.add(record); //add the record to the store 
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json()) //pass response parameter and attach it to json function in order to extract json api response. 
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["pending"], "readwrite"); //setting us up to make a querry against indexDb

        // access your pending object store
        const store = transaction.objectStore("pending"); //identifies which table we are going to make the querry against

        // clear all items in your store
        store.clear(); //clear out the table because we already sent the info that was in the indexDb up to the remote database 
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
