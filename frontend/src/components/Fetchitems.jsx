import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { itemsActions } from "../store/itemsSlice";
import { fetchStatusActions } from "../store/fetchStatusSlice";
import { adminApiUrl } from "../utils/adminApi";

const FetchItems = () => {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const dispatch = useDispatch();

  useEffect(() => {
    if (fetchStatus.fetchDone) return;

    dispatch(fetchStatusActions.markFetchingStarted());

    fetch(adminApiUrl("/products"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to load products");
        }
        return res.json();
      })
      .then((data) => {
        dispatch(fetchStatusActions.markFetchDone());
        dispatch(itemsActions.addInitialItems(data.products || []));
      })
      .catch((error) => {
        console.error("Product fetch failed:", error.message);
        dispatch(fetchStatusActions.markFetchDone());
      })
      .finally(() => {
        dispatch(fetchStatusActions.markFetchingFinished());
      });
  }, [fetchStatus.fetchDone, dispatch]);

  return null;
};

export default FetchItems;
