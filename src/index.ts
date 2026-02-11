import express from "express";
import cors from "cors";
import assessmentRoutes from "./routes/assessment.routes";
import eventRoutes from "./routes/event.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assessment", assessmentRoutes);
app.use("/api/events", eventRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});
