import fs from "fs/promises";
import path from "path";

const filePath = path.join(__dirname, "../../data/attempts.json");

export async function createAttempt(attempt: any) {
  let attempts = [];

  try {
    const data = await fs.readFile(filePath, "utf-8");
    attempts = data ? JSON.parse(data) : [];
  } catch (err) {
    attempts = [];
  }

  attempts.push(attempt);

  await fs.writeFile(filePath, JSON.stringify(attempts, null, 2));
}
