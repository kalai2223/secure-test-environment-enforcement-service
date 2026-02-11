// import geoip from "geoip-lite";

// export function getGeoDetails(ip: string) {
//   const geo = geoip.lookup(ip);

//   return {
//     country: geo?.country ?? "Unknown",
//     region: geo?.region ?? "Unknown",
//     city: geo?.city ?? "Unknown"
//   };
// }
import axios from "axios";

export async function getIPDetails(ip: string) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`);

    return {
      country: response.data.country || "Unknown",
      region: response.data.region || "Unknown",
      city: response.data.city || "Unknown",
      isp: response.data.org || "Unknown",
    };
  } catch (err) {
    return {
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      isp: "Unknown",
    };
  }
}
