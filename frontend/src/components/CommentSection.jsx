import React, { useEffect, useState } from "react";
import "./CommentSection.css";
import { getCommentsByJoke, addComment } from "../services/api.js"
import socket from "../socket";

export default function CommentSection({ jokeId, token }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoadComments = async () => {
    try {
      setLoading(true);
      const data = await getCommentsByJoke(jokeId);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    console.log("handlesubmit is rubbing");
    if (!comment.trim()) return;

    try {
      await addComment(jokeId, comment, token);
      setComment("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    handleLoadComments();

    socket.emit("joinJokeRoom", jokeId);

    socket.on("newComment", (data) => {
      if (data.jokeId === jokeId) {
        setComments((prev) => [...prev, data.comment]);
      }
    });

    return () => socket.off("newComment");
  }, [jokeId]);

  return (
    <div className="comment-box">
      <h4 className="comment-title">Comments</h4>

      {loading && <p className="loading">Loading...</p>}

      <div className="comment-list">
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <span className="comment-user">{c.username}</span>
            <p className="comment-text">{c.comment}</p>
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

        <button onClick={handleSubmitComment}>
          Post
        </button>
      </div>
    </div>
  );
}