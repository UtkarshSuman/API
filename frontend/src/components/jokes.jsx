import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllJokes,
  getRandomJoke,
  getJokeById,
  addJoke,
  deleteJoke,
  logoutUser
} from "../services/api.js";

function Jokes() {
  const navigate = useNavigate();

  const [jokes, setJokes] = useState([]);
  const [jokeId, setJokeId] = useState("");
  const [newJoke, setNewJoke] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Get All Jokes
  const handleGetAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllJokes();
      setJokes(data);
    } catch (err) {
      setError(err.message || "Failed to fetch jokes");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get Random Joke
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

  // ✅ Get Joke By ID
  const handleGetById = async () => {
    if (!jokeId.trim()) return;

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


  const handleLogout = () => {
  logoutUser();
  navigate("/login");   // or "/" depending on where your modal is
};

  const handleDelete = async (id) => {
    try {
      await deleteJoke(id);

      // Remove joke from UI instantly
      setJokes(jokes.filter((joke) => joke.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Add Joke
  const handleAddJoke = async () => {
    if (!newJoke.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const created = await addJoke(newJoke);
      setJokes((prev) => [...prev, created]);
      setNewJoke("");
    } catch (err) {
      setError(err.message || "Failed to add joke");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg">
      <h1 className="welcome-text">Welcome to Jokes App 🎉</h1>

      <button onClick={handleLogout} className="logout-btn">
       Logout
      </button>

      <div className="jokes-container">
        <h2>😂 Jokes Corner</h2>

        <div className="button-group">
          <button onClick={handleGetAll}>Get All Jokes</button>
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
        {!loading && jokes.length === 0 && <p>No jokes found 😅</p>}

        {/* Joke List */}
        <ul className="jokes-list">
          {jokes.map((j) => (
            <li key={j.id} className="joke-card">
              <p>{j.content}</p>

              {j.author_name && <small>By: {j.author_name}</small>}

              {/* Show delete button only for admin or joke owner */}
              {(localStorage.getItem("role") === "admin" ||
                localStorage.getItem("username") === j.author_email) && (
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(j.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Jokes;
