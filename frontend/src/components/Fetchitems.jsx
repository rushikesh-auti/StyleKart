import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { itemsActions } from "../store/itemsSlice";
import { fetchStatusActions } from "../store/fetchStatusSlice";
import { getProducts } from "../utils/productApi";

const FetchItems = () => {
  const fetchStatus = useSelector((store) => store.fetchStatus);
  const dispatch = useDispatch();

  useEffect(() => {
    if (fetchStatus.fetchDone || fetchStatus.currentlyFetching) {
      return;
    }

    const fetchInitialProducts = async () => {
      dispatch(fetchStatusActions.markFetchingStarted());

      try {
        const data = await getProducts({
          page: 1,
          limit: 48,
          sort: "newest",
        });

        dispatch(itemsActions.addInitialItems(data.products || []));
        dispatch(fetchStatusActions.markFetchDone());
      } catch (error) {
        dispatch(
          fetchStatusActions.markFetchFailed(
            error.message || "Unable to load products. Please try again.",
          ),
        );
      } finally {
        dispatch(fetchStatusActions.markFetchingFinished());
      }
    };

    fetchInitialProducts();
  }, [
    dispatch,
    fetchStatus.currentlyFetching,
    fetchStatus.fetchDone,
  ]);

  return null;
};

export default FetchItems;