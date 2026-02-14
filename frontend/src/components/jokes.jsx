import { useState } from "react";
import {
  getAllJokes,
  getRandomJoke,
  getJokeById,
  addJoke
} from "../services/api.js";

function Jokes() {
  const [jokes, setJokes] = useState([]);
  const [jokeId, setJokeId] = useState("");
  const [newJoke, setNewJoke] = useState("");

  async function handleGetAll() {
    const data = await getAllJokes();
    setJokes(data);
  }

  async function handleRandom() {
    const data = await getRandomJoke();
    setJokes([data]);
  }

  async function handleGetById() {
    if (!jokeId) return;
    const data = await getJokeById(jokeId);
    setJokes([data]);
  }

  async function handleAddJoke() {
    if (!newJoke) return;
    const created = await addJoke(newJoke);
    setJokes([...jokes, created]);
    setNewJoke("");
  }

  return (
    <div>
      <h2>😂 Jokes</h2>

      <button onClick={handleGetAll}>Get All Jokes</button>
      <button onClick={handleRandom}>Get Random Joke</button>

      <div>
        <input
          placeholder="Joke ID"
          value={jokeId}
          onChange={e => setJokeId(e.target.value)}
        />
        <button onClick={handleGetById}>Get Joke by ID</button>
      </div>

      <div>
        <input
          placeholder="New joke"
          value={newJoke}
          onChange={e => setNewJoke(e.target.value)}
        />
        <button onClick={handleAddJoke}>Add Joke</button>
      </div>

      <ul>
        {jokes.map(j => (
          <li key={j.id}>{j.joke}</li>
        ))}
      </ul>
    </div>
  );
}

export default Jokes;
