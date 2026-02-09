import fs from "fs/promises";
import path from "path";

const filePath = path.join(__dirname, "../../data/events.json");

export async function logEvent(event: any) {
  const data = await fs.readFile(filePath, "utf-8");
  const events = JSON.parse(data);
  events.push(event);
  await fs.writeFile(filePath, JSON.stringify(events, null, 2));
}
