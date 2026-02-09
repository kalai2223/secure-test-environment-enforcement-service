import axios from "axios";
import { Request } from "express";

export async function resolveIP(req: Request): Promise<string> {
  let ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "UNKNOWN";

  // If local IP, fetch real public IP
  if (ip === "::1" || ip === "127.0.0.1") {
    const response = await axios.get("https://api.ipify.org?format=json");
    ip = response.data.ip;
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}
