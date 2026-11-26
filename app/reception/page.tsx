import { hotel, rooms } from "@/lib/hotel";
import Kiosk from "./kiosk";

export const metadata = { title: "Reception · The Pearls" };

/** The lobby tablet: full screen, no site header or footer. */
export default function Reception() {
  const roomPhotos = Object.fromEntries(Object.entries(rooms).map(([id, room]) => [id, room.photo]));
  return <Kiosk timeZone={hotel.timeZone} roomPhotos={roomPhotos} />;
}
