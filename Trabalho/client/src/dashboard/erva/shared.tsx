import type { MessageInstance } from "antd/es/message/interface";
import { query_endpoint, type herbEntryData } from "./erva";
import { getNewTokenIfExpired } from "../../util";

export async function getEntries(
  msg: MessageInstance,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setData: React.Dispatch<React.SetStateAction<herbEntryData[]>>,
) {
  try {
    setLoading(true);
    await getNewTokenIfExpired();
    const response = await fetch(query_endpoint, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const raw_data = await response.json();
      setData(raw_data);
      setLoading(false);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      msg.open({
        type: "error",
        content: ["Sessão expirada"],
      });
    }
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
}
