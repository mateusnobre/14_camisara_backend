import "./setup.js";
import app from "./ServerApp.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
