import React, { useEffect, useState } from "react";
import "./CommentSection.css";
import { getCommentsByJoke, addComment } from "../services/api.js"
import socket from "../socket";

export default function CommentSection({ jokeId, token, cachedComments, setCommentsMap }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);


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
      setComment([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
  if (!comment.trim()) return;

  try {

    setLoading(true);
    const newComment = await addComment(jokeId, comment, token);

    // for instant ui update
    setComments(prev => [...prev, newComment]);

    // this will Update cache also
      setCommentsMap(prev => ({
        ...prev,
        [jokeId]: [...(prev[jokeId] || []), newComment]
      }));

    setComment("");
  } catch (err) {
    console.error("Add comment error:",err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (cachedComments) {
    setComments(cachedComments); //to instantly load comments
  } else {
    handleLoadComments();
  }

  socket.emit("joinJokeRoom", jokeId);

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

    socket.on("newComment",handleNewComment);

  return () => socket.off("newComment",handleNewComment);
}, [jokeId]);

  return (
    <div className="comment-box">
      <h4 className="comment-title">Comments</h4>

      {loading && <p className="loading">Loading...</p>}

      <div className="comment-list">
        {!loading && comments.length === 0 && (
          <p className="empty">No comments yet!!</p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-user">{c.username}</div>
            <div className="comment-text">{c.comment}</div>
          </div>
        ))}
      </div>

      <div className="comment-input-box">
        <input
          type="text"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button onClick={handleSubmitComment} disabled={loading}>
          Post
        </button>
      </div>
    </div>
  );
}