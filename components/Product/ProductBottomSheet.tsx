"use client";

import { useEffect } from "react";
import { FiChevronUp } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useGetProductsQuery } from "@/lib/store/api/productApi";
import {
  setProductError,
  setProductLoading,
  setProducts,
} from "@/lib/store/slices/productSlice";
import { toggleBottomSheet } from "@/lib/store/slices/roomSlice";
import { CARD_ART_STYLES } from "./type";
import { ProductCard } from "./ProductCard";

const ProductBottomSheet = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: RootState) => state.room.settings.bottomSheet
  );
  const products = useSelector((state: RootState) => state.product.items);
  const isLoading = useSelector((state: RootState) => state.product.loading);
  const productError = useSelector((state: RootState) => state.product.error);

  const {
    data: productData,
    isLoading: queryLoading,
    isFetching: queryFetching,
    isError: queryIsError,
  } = useGetProductsQuery();

  useEffect(() => {
    dispatch(setProductLoading(queryLoading || queryFetching));
  }, [dispatch, queryLoading, queryFetching]);

  useEffect(() => {
    if (productData) {
      dispatch(setProducts(productData));
    }
  }, [dispatch, productData]);

  useEffect(() => {
    dispatch(setProductError(queryIsError ? "Could not load products." : null));
  }, [dispatch, queryIsError]);

  const productsForGrid = products.slice(0, 12);
  const expandedSheetMaxHeight = "min(72vh, calc(100% - 2.5rem))";
  const innerContentMaxHeight = "min(62vh, calc(100% - 2.5rem))";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 top-2 z-30 flex justify-end">
      <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end">
        {isOpen && <button
          type="button"
          onClick={() => dispatch(toggleBottomSheet())}
          aria-expanded={isOpen}
          aria-controls="product-bottom-sheet"
          className={`
            pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full cursor-pointer sm:h-8 sm:w-8
            transition-all duration-300
            bg-neutral-800 hover:bg-neutral-900
            shadow-sm hover:shadow-md
          `}
        >
          <FiChevronUp
            size={16}
            className={`
      transition-transform duration-300 ease-in-out text-neutral-100
      ${isOpen ? "rotate-180" : "rotate-0"}
    `}
          />
        </button>}

        <div
          id="product-bottom-sheet"
          className={`pointer-events-auto mt-2 w-full overflow-hidden rounded-xl backdrop-blur-xl transition-all duration-300 sm:rounded-2xl ${
            isOpen
              ? "translate-y-0 border-white/12 opacity-100"
              : "max-h-0 translate-y-2 border-transparent opacity-0"
          }`}
          style={isOpen ? { maxHeight: expandedSheetMaxHeight } : undefined}
        >
          <div
            className="relative overflow-y-auto p-2.5 sm:p-3"
            style={isOpen ? { maxHeight: innerContentMaxHeight } : undefined}
          >
            
            {isLoading ? (
              <p className="relative text-xs text-white/65">Loading products...</p>
            ) : productError ? (
              <p className="relative text-xs text-rose-300/85">{productError}</p>
            ) : productsForGrid.length === 0 ? (
              <p className="relative text-xs text-white/65">No products available right now.</p>
            ) : (
              <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {productsForGrid.map((product, index) => {
                  const art = CARD_ART_STYLES[index % CARD_ART_STYLES.length];
                  return (
                      <ProductCard key={`${product.id}-${index}`} product={product} art={art} />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBottomSheet;
