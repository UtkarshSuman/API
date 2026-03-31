import React, { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import {
  getAllJokes,
  getTrendingJokes,
  getRandomJoke,
  getJokeById,
  addJoke,
  deleteJoke,
  updateJoke,
  likeJoke,
  logoutUser,
  normalizeJoke,
} from "../services/api.js";
import TopNav from "./TopNav.jsx";
import CommentSection from "./CommentSection.jsx";

function Jokes() {
  const navigate = useNavigate();

  const [jokes, setJokes] = useState([]);
  const [jokeId, setJokeId] = useState("");
  const [newJoke, setNewJoke] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likedId, setLikedId] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [activeLikeId, setActiveLikeId] = useState(null);
  const [openComments, setOpenComments] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [mode, setMode] = useState("latest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // load jokes effect
useEffect(() => {
  if (mode === "latest") {
    fetchJokes();
  }
}, [page, mode]);

useEffect(() => {
  socket.connect();

  return () => {
    socket.disconnect();
  };
}, []);

useEffect(() => {
  const userId = localStorage.getItem("userId");

  if (!userId) return;

  const handleConnect = () => {
    console.log("Socket connected:", socket.id);
    socket.emit("userOnline", userId); // always runs after connect
  };

  socket.on("connect", handleConnect);

  // if already connected
  if (socket.connected) {
    handleConnect();
  }

  return () => {
    socket.off("connect", handleConnect);
  };
}, []);


useEffect(() => {
  const handleOnlineUsers = (count) => {
    console.log("Online Users:", count);
  };

  socket.on("onlineUsers", handleOnlineUsers);

  return () => {
    socket.off("onlineUsers", handleOnlineUsers);
  };
}, []);

useEffect(() => {
  if (jokeId) {
    socket.emit("joinJokeRoom", jokeId);
  }
}, [jokeId]);




  // infinite scroll effect
  useEffect(() => {
  const handleScroll = () => {
    if (
  window.innerHeight + document.documentElement.scrollTop + 100 >=
    document.documentElement.scrollHeight &&
  hasMore &&
  !loading
) {
  setPage(prev => prev + 1);
}
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, [hasMore, loading, mode]);


useEffect(() => {
  const handleCommentCount = (data) => {
    setJokes(prev =>
      prev.map(j =>
        j.id === data.jokeId
          ? { ...j, comments_count: data.commentsCount }
          : j
      )
    );
  };

  socket.on("commentCountUpdated", handleCommentCount);

  return () => socket.off("commentCountUpdated", handleCommentCount);
}, []);



  // socket listener code
useEffect(() => {
  const handleLikeUpdate = (data) => {
    setJokes((prev) => {
      return prev.map((j) => {
        if (j.id === data.jokeId) {
          return { ...j, likes: data.likes };
        }
        return j;
      });
    });
  };

  socket.on("likeUpdated", handleLikeUpdate);

  return () => {
    socket.off("likeUpdated", handleLikeUpdate);
  };
}, []);


  const userId = localStorage.getItem("userId");


  const loadJokes = async () => {
  try {
    setLoading(true);

    if (mode === "latest") {
      const res = await getAllJokes(page);

      setJokes(prev => [...prev, ...res.jokes]);
      setHasMore(res.hasMore);

    } else {
      // trending doesn't paginate
      const trending = await getTrendingJokes();
      setJokes(trending);
      setHasMore(false);
    }

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


const handleGetAll = async () => {
  
  try {
    setMode("latest");
    setLoading(true);

    setJokes([]);
    setPage(1);
    setHasMore(true);

    const data = await getAllJokes(1);

    setJokes(data.jokes);
    setHasMore(data.hasMore);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // Get All Jokes
  const fetchJokes = async () => {
  if (loading || !hasMore) return;

  setLoading(true);
  setError(null);

  try {
    const data = await getAllJokes(page);

    // ensure it's always an array
    const incoming = Array.isArray(data.jokes) ? data.jokes : [];

    setJokes((prev) => {
      const prevIds = new Set(prev.map((j) => j.id));

      const filtered = incoming.filter((j) => !prevIds.has(j.id));

      return [...prev, ...filtered];
    });

    setHasMore(data.hasMore ?? false);

  } catch (err) {
    setError(err.message || "Failed to fetch jokes");
  } finally {
    setLoading(false);
  }
};


  // Get Random Joke
  const handleRandom = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getRandomJoke();
      setJokes([data]);
    } catch (err) {
      setError(err.message || "Failed to fetch random joke");
    } finally {
      setLoading(false);
    }
  };

  // Get Joke By ID
  const handleGetById = async () => {
    if (!jokeId.trim() || isNaN(jokeId)) {
    setError("Please enter a valid numeric ID");
    return;
  }

    setLoading(true);
    setError(null);

    try {
      const data = await getJokeById(jokeId);
      setJokes([data]);
      setJokeId("");
    } catch (err) {
      setError(err.message || "Joke not found");
      setJokes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // remove instantly from UI
    const previousJokes = jokes;
    setJokes((prev) => prev.filter((j) => j.id !== id));

    try {
      await deleteJoke(id);
    } catch (err) {
      //  rollback if API fails
      setJokes(previousJokes);
      alert(err.message);
    }
  };

  // Add Joke
  const handleAddJoke = async () => {
    if (!newJoke.trim()) return;

    const tempJoke = normalizeJoke({
      id: Date.now(),
      content: newJoke,
      author_name: localStorage.getItem("name") || "You",
      comments_count: 0, 
      likes: 0 
    });

    // instant UI update
    setJokes((prev) => [...prev, tempJoke]);
    setNewJoke("");

    try {
      const created = await addJoke(newJoke);

      // replace temp joke with real one
      setJokes((prev) => prev.map((j) => (j.id === tempJoke.id ? normalizeJoke(created) : j)));
    } catch (err) {
      setError(err.message || "Failed to add joke");

      // rollback
      setJokes((prev) => prev.filter((j) => j.id !== tempJoke.id));
    }
  };

  // edit joke
  const handleEdit = (joke) => {
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    if (role !== "admin" && username !== joke.author_email) {
      alert("Only the author can edit this joke");
      return;
    }

    setEditingId(joke.id);
    setEditText(joke.content);
  };

  const handleUpdate = async (id) => {
    try {
      const updated = await updateJoke(id, editText);

      setJokes((prev) => prev.map((j) => (j.id === id ? updated : j)));

      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // like button
  const handleLike = async (id) => {
    try {
      const updated = await likeJoke(id);

      // update UI
      setJokes((prev) => prev.map((j) => (j.id === id ? updated : j)));

      // trigger animation after success
      setActiveLikeId(id);

      const newHearts = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 40 - 20,
      }));

      setHearts(newHearts);

      setTimeout(() => {
        setHearts([]);
        setActiveLikeId(null);
      }, 900);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTrending = async () => {
  try {
    setLoading(true);

    setMode("trending");
    setJokes([]);      // reset
    setPage(1);
    setHasMore(false); // no infinite scroll for trending

    const trending = await getTrendingJokes();

    setJokes(trending); // now ALWAYS array 

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  //if required one button with dual function 
  const handleToggleFeed = async () => {
  try {
    setLoading(true);

    if (mode === "latest") {
      // switch to trending
      handleTrending();
    } else {
      //switch back to latest
      handleGetAll();
    }

  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page-bg">
      <TopNav />
      <h1 className="welcome-text">Welcome to Jokes App 🎉</h1>

      {/* <button onClick={handleLogout} className="logout-btn">
       Logout
      </button>
      <button onClick={() => navigate("/login")}>
        Open Login
      </button> */}

      <div className="jokes-container">
        <h2>😂 Jokes Corner</h2>

        <div className="button-group">
          <button onClick={handleGetAll}>Get All Jokes</button>
          <button onClick={handleTrending}>Trending Jokes</button>
          <button onClick={handleRandom}>Random Joke</button>
        </div>

        <div className="input-group">
          <input
            placeholder="Enter Joke ID..."
            value={jokeId}
            onChange={(e) => setJokeId(e.target.value)}
          />
          <button onClick={handleGetById}>Find Joke</button>
        </div>

        <div className="input-group">
          <input
            placeholder="Write a new joke..."
            value={newJoke}
            onChange={(e) => setNewJoke(e.target.value)}
          />
          <button onClick={handleAddJoke}>Add Joke</button>
        </div>

        {/* Loading */}
        {loading && <p>Loading...</p>}

        {/* Error */}
        {error && <p className="error">{error}</p>}

        {/* Empty State */}
        {!loading && jokes.length === 0 && <p> Let's get some jokes 😅</p>}

        {/* Joke List */}
        <ul className="jokes-list">
          {Array.isArray(jokes) && jokes.map((j,index) => (
            <li key={j.id } className="joke-card">
              {editingId === j.id ? (
                <>
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />

                  <button onClick={() => handleUpdate(j.id)}>Save</button>

                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <p>{j.content}</p>

                  {j.author_name && <small>By: {j.author_name}</small>}

                  <div className="joke-actions">
                    <div className="like-container">
                      <button
                        className="like-btn"
                        onClick={() => handleLike(j.id)}
                      >
                        ❤️ {j.likes ?? 0}
                      </button>

                      {activeLikeId === j.id &&
                        hearts.map((h) => (
                          <span
                            key={h.id}
                            className="floating-heart"
                            style={{ left: `${h.left}px` }}
                          >
                            ❤️
                          </span>
                        ))}
                    </div>

                    {/* 💬 COMMENT BUTTON */}
                    <button
                      onClick={() =>
                        setOpenComments(openComments === j.id ? null : j.id)
                      }
                    >
                      💬{j.comments_count ?? 0}
                    </button>

                    {(localStorage.getItem("role") === "admin" ||
                      localStorage.getItem("username") === j.author_email) && (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(j)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(j.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {openComments === j.id && (
                    <CommentSection
                      jokeId={j.id}
                      token={localStorage.getItem("token")}
                      cachedComments={commentsMap[j.id]}
                      setCommentsMap={setCommentsMap}
                    />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Jokes;

{
  /* <button onClick={() => setOpenComments(joke.id)}>
💬 Comment
</button>
{openComments === joke.id && (
  <CommentSection jokeId={joke.id} token={token} />
)} */
}
