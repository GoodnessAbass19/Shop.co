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
        categoryName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
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

export const GET_PRODUCT_BY_SIZES = gql`
  query getProduct($size: [Sizes!], $tag: ProductTag!) {
    products(
      where: {
        productSizes_contains_some: $size
        productTag_contains_some: [$tag]
      }
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
        productName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
    }
  }
`;

export const GET_PRODUCT_BY_CATEGORY_AND_SIZES = gql`
  query getProduct($category: String, $first: Int, $size: [Sizes!]) {
    products(
      where: {
        category_some: { slug: $category }
        productSizes_contains_some: $size
      }
      first: $first
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
        categoryName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
    }
  }
`;

export const GET_PRODUCT_BY_CATEGORY = gql`
  query getProduct($category: String, $first: Int) {
    products(where: { category_some: { slug: $category } }, first: $first) {
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
        categoryName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
    }
  }
`;

export const GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES = gql`
  query getProduct(
    $category: String
    $first: Int
    $subCategory: String
    $size: [Sizes!]
  ) {
    products(
      where: {
        category_some: { slug: $category }
        subCategory: { slug: $subCategory }
        productSizes_contains_some: $size
      }
      first: $first
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
        categoryName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
    }
  }
`;

export const GET_PRODUCT_BY_SUBCATEGORY = gql`
  query getProduct($category: String, $first: Int, $subCategory: String) {
    products(
      where: {
        category_some: { slug: $category }
        subCategory: { slug: $subCategory }
      }
      first: $first
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
        categoryName
      }
      slug
      stock
      productTag
      productSizes
      colours {
        hex
      }
      review
    }
  }
`;
