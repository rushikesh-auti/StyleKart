import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { itemsActions } from "../store/itemsSlice";
import { fetchStatusActions } from "../store/fetchStatusSlice";
import { adminApiUrl } from "../utils/adminApi";

const FetchItems = () => {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const dispatch = useDispatch();

  useEffect(() => {
    if (fetchStatus.fetchDone || fetchStatus.currentlyFetching) {
      return;
    }

    const fetchProducts = async () => {
      dispatch(fetchStatusActions.markFetchingStarted());

      try {
        const response = await fetch(adminApiUrl("/products"));

        if (!response.ok) {
          throw new Error("Unable to load products. Please try again.");
        }

        const data = await response.json();

        dispatch(itemsActions.addInitialItems(data.products || []));
        dispatch(fetchStatusActions.markFetchDone());
      } catch (error) {
        console.error("Product fetch failed:", error.message);

        dispatch(
          fetchStatusActions.markFetchFailed(
            error.message || "Unable to load products. Please try again.",
          ),
        );
      } finally {
        dispatch(fetchStatusActions.markFetchingFinished());
      }
    };

    fetchProducts();
  }, [dispatch, fetchStatus.currentlyFetching, fetchStatus.fetchDone]);

  return null;
};

export default FetchItems;
