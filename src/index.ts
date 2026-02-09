import express from "express";
import cors from "cors";
import assessmentRoutes from "./routes/assessment.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assessment", assessmentRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
