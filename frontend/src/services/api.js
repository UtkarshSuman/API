const API_URL = "http://localhost:3000";

export async function getAllJokes() {
  const res = await fetch(`${API_URL}/jokes`);
  return res.json();
}

export async function getRandomJoke() {
  const res = await fetch(`${API_URL}/jokes/random`);
  return res.json();
}

export async function getJokeById(id) {
  const res = await fetch(`${API_URL}/jokes/${id}`);
  return res.json();
}

export async function addJoke(joke) {
  const res = await fetch(`${API_URL}/jokes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ joke })
  });

  return res.json();
}
