import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Jokes from "../components/jokes";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <div>
      <button onClick={() => navigate("/login")}>
        Open Login
      </button>
      </div>

      <Jokes/>
    </div>
  );
}
