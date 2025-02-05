import RecentlyViewed from "../products/Recent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import CartBody from "./CartBody";

const Cart = () => {
  return (
    <div className="mt-5">
      <div className="max-w-screen-xl px-2 mx-auto pb-10">
        <Breadcrumb className="block px-5">
          <BreadcrumbList className="dark:text-white text-black">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="text-xs md:text-sm font-normal font-sans"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className=" text-xs md:text-sm font-normal font-sans">
                Cart
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-6 uppercase">
          Your cart
        </h1>

        <div className="mt-4">
          <CartBody />
        </div>

        <div className="mt-5">
          <RecentlyViewed />
        </div>
      </div>
    </div>
  );
};

export default Cart;
