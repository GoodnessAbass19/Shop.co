import { productTags } from "@/types";
import { gql } from "@apollo/client";

export const GET_PRODUCT = gql`
  query GetProducts($first: Int) {
    products(first: $first) {
      id
      productName
      description
      images {
        url
        width
        height
        id
      }
      price
      discountedPrice
      productDetails {
        text
      }
      category {
        id
      }
      slug
      stock
    }
  }
`;

export const GET_PRODUCTS_BY_TAGS = gql`
  query getProducts($tag: ProductTag!, $first: Int) {
    products(where: { productTag_contains_some: [$tag] }, first: $first) {
      description
      productName
      id
      images {
        url
        width
        height
        id
      }
      price
      discountedPrice
      productDetails {
        text
      }
      category {
        id
      }
      slug
      stock
      productTag
      productSizes
    }
  }
`;

export const GET_SINGLE_PRODUCT = gql`
  query getProduct($slug: String) {
    product(where: { slug: $slug }) {
      description
      productName
      id
      images {
        url
        width
        height
        id
      }
      price
      discountedPrice
      productDetails {
        text
      }
      category {
        id
        productName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
    }
  }
`;

export const GET_RELATED_PRODUCTS = gql`
  query getProduct($tag: ProductTag!, $name: String) {
    products(
      where: {
        productTag_contains_some: [$tag]
        productName_not_contains: $name
      }
      first: 10
    ) {
      description
      productName
      id
      images {
        url
        width
        height
        id
      }
      price
      discountedPrice
      productDetails {
        text
      }
      category {
        id
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
    }
  }
`;
