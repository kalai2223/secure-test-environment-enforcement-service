import fs from "fs/promises";
import path from "path";

const filePath = path.join(__dirname, "../../data/attempts.json");

async function readAttempts() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createAttempt(attempt: any) {
  const attempts = await readAttempts();
  attempts.push(attempt);
  await fs.writeFile(filePath, JSON.stringify(attempts, null, 2));
}

export async function findAttempt(attemptId: string) {
  const attempts = await readAttempts();
  return attempts.find(a => a.attemptId === attemptId);
}

export async function updateAttempt(updatedAttempt: any) {
  const attempts = await readAttempts();
  const index = attempts.findIndex(a => a.attemptId === updatedAttempt.attemptId);

  if (index !== -1) {
    attempts[index] = updatedAttempt;
    await fs.writeFile(filePath, JSON.stringify(attempts, null, 2));
  }
}
