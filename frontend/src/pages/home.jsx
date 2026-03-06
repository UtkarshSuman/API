import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Jokes from "../components/jokes";
import TopNav from "../components/TopNav";
export default function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <Jokes/>
    </div>
  );
}
