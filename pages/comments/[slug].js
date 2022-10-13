import Message from "../../components/Message";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import { toast } from "react-toastify";
const toastObj = { position: "top-center", autoClose: 1500 };

export default function Details() {
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);

  const [user, loading] = useAuthState(auth);
  const route = useRouter();
  const routeData = route.query;

  // Submit handler:
  const submitMessage = async () => {
    // Check if user is logged in:
    // if (!user) return route.push("/auth/login");
    if (!auth.currentUser) return route.push("/auth/login");
    if (!message) {
      toast.error("Don't leave an empty message 😅", toastObj);
      return; // exit logic!
    }
    // TODO: Update (CRUD) operation:
    // We use `arrayUnion` to create a new array and fill it with an object.
    // And if we add new stuff to it, its going to update that object for us.
    // Returns a special value that can be used with `updateDoc` that tells the
    // server to union the given elements with array values that already exists
    // on the server. Each specified element that doesn't already exist in the
    // array will be added. If the field being modified is not already an array
    // it will be overwritten with an array, containing those elements.
    // @param `elements` — The elements to union into the array.
    const docRef = doc(db, "posts", routeData.id); // doc `id` from our route
    await updateDoc(docRef, {
      comments: arrayUnion({
        message,
        // avatar: user.photoURL,
        // userName: user.displayName,
        avatar: auth.currentUser.photoURL,
        userName: auth.currentUser.displayName,
        time: Timestamp.now(),
      }),
    });
    setMessage(""); // Will reset <input> after submission.
  };

  // Get comments handler:
  // TODO: Read (CRUD) operation:
  const getComments = async () => {
    const docRef = doc(db, "posts", routeData.id);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      try {
        setAllMessages(snapshot.data().comments);
      } catch (error) {
        return <p>error</p>;
      }
    });
    return unsubscribe;
    // Option 2: `getDoc` has no event listener:
    // const docSnap = await getDoc(docRef);
    // const data = docSnap.data().comments;
    // setAllMessages(data);
  };
  useEffect(() => {
    if (!route.isReady) return;
    getComments();
  }, [route.isReady]);

  return (
    <div>
      <Message {...routeData}></Message>
      <div className="my-4">
        <div className="flex">
          <input
            onChange={(e) => setMessage(e.target.value)}
            type="text"
            value={message}
            placeholder="Send a message 😀"
            className="bg-gray-800 w-full p-2 text-white text-sm"
          />
          <button
            onClick={submitMessage}
            className="bg-cyan-500 py-2 px-4 text-sm rounded-r-sm"
          >
            Submit
          </button>
        </div>
        <div className="py-6">
          <h2 className="font-bold">Comments</h2>
          {allMessages.map((msg) => (
            <div
              key={msg.time}
              className="bg-white p-4 my-4 border-2 shadow-lg rounded-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <img className="w-10 rounded-full" src={msg.avatar} alt="" />
                <h2>{msg.userName}</h2>
              </div>
              <h2>{msg.message}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
