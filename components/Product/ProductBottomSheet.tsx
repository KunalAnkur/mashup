"use client";

import { useEffect } from "react";
import { FiChevronUp, FiShoppingBag } from "react-icons/fi";
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

  return (
    <div className="pointer-events-none absolute w-full bottom-2 z-30 flex justify-end ">
      <div className="pointer-events-auto w-full flex flex-col justify-center items-center">
        {isOpen && <button
          type="button"
          onClick={() => dispatch(toggleBottomSheet())}
          aria-expanded={isOpen}
          aria-controls="product-bottom-sheet"
          className={`
            w-8 h-8 flex items-center justify-center rounded-full cursor-pointer
            transition-all duration-300
            bg-neutral-800/30 hover:bg-neutral-900
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
          className={`mt-2 overflow-hidden w-full rounded-2xl  backdrop-blur-xl transition-all duration-300 ${
            isOpen
              ? "max-h-[72vh] translate-y-0 border-white/12 opacity-100"
              : "max-h-0 translate-y-2 border-transparent opacity-0"
          }`}
        >
          <div className="relative max-h-[62vh] overflow-y-auto p-3">
            
            {isLoading ? (
              <p className="relative text-xs text-white/65">Loading products...</p>
            ) : productError ? (
              <p className="relative text-xs text-rose-300/85">{productError}</p>
            ) : productsForGrid.length === 0 ? (
              <p className="relative text-xs text-white/65">No products available right now.</p>
            ) : (
              <div className="relative grid grid-cols-4 gap-3">
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
