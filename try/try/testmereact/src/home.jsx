import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [numQuestions, setNumQuestions] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user details
    axios
      .get("http://127.0.0.1:8000/user-details/", { withCredentials: true })
      .then((response) => {
        setUserDetails(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, []);

  const handleStartQuiz = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/start-quiz/",
        { topic, difficulty, num_questions: numQuestions },
        { withCredentials: true }
      );
      if (response.status === 200) {
        navigate("/quiz"); // Redirect to quiz page
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Welcome, {userDetails.username}!</h2>
      <h3>Your Topics:</h3>
      <ul>
        {userDetails.master_topics.map((topic, index) => (
          <li key={index}>{topic}</li>
        ))}
      </ul>
      <h3>Start a Quiz</h3>
      <div>
        <label>Topic:</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>
      <div>
        <label>Number of Questions:</label>
        <input
          type="number"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
          min="1"
          required
        />
      </div>
      <button onClick={handleStartQuiz}>Start Quiz</button>
    </div>
  );
};

export default Home;