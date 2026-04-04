import React, { useEffect, useState } from "react";
import "./CommentSection.css";
import { getCommentsByJoke, addComment } from "../services/api.js"
import socket from "../socket";

export default function CommentSection({ jokeId, token, cachedComments, setCommentsMap }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);


  useEffect(() => {
  const box = document.querySelector(".comment-list");
  if (box) box.scrollTop = box.scrollHeight;
  }, [comments]);


  // loads comments with caching
  const handleLoadComments = async () => {
    try {
      setLoading(true);
      const data = await getCommentsByJoke(jokeId);
      
      const safeData = Array.isArray(data) ? data : [];

      setComments(safeData);

      // Save to cache
      setCommentsMap(prev => ({
        ...prev,
        [jokeId]: safeData
      }));

    } catch (err) {
      console.error("Loading comments error",err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
  if (!comment.trim()) return;

  try {
    setPosting(true);
    
     const newComment = await addComment(jokeId, comment);

     //fallback UI update (only if socket slow)
    setComments(prev => [...prev, newComment]);

    setComment("");
  } catch (err) {
    console.error("Add comment error:",err);
  } finally {
    setPosting(false);
  }
};

  useEffect(() => {
  if (cachedComments) {
    setComments(cachedComments); //to instantly load comments
  } else {
    handleLoadComments();
  }

  socket.emit("joinJokeRoom", `joke_${jokeId}`);

  // Listen for new comments (NO DUPLICATES)
    const handleNewComment = (data) => {
      if (data.jokeId === jokeId) {
        setComments(prev => {
          const exists = prev.some(c => c.id === data.comment.id);
          if (exists) return prev;
          return [...prev, data.comment];
        });

        // update cache also
        setCommentsMap(prev => ({
          ...prev,
          [jokeId]: [...(prev[jokeId] || []), data.comment]
        }));
      }
    };
    
    socket.off("newComment");   //prevent duplicates
    socket.on("newComment",handleNewComment);

  return () => socket.off("newComment",handleNewComment);
}, [jokeId,setCommentsMap]);

  return (
     <div className="comment-box">
    <h4 className="comment-title">Comments</h4>

    <div className="comment-list">
      {loading ? (
        <p className="loading">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="empty">No comments yet!!</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-user">{c.username}</div>
            <div className="comment-text">{c.comment}</div>
          </div>
        ))
      )}
    </div>

      <div className="comment-input-box">
        <input
          type="text"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmitComment(); //for nice UX
        }}
        />

        <button onClick={handleSubmitComment} disabled={posting}>
          Post
        </button>
      </div>
    </div>
  );
}