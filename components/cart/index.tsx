import RecentlyViewed from "../products/Recent";
import CartBody from "./CartBody";

const Cart = () => {
  return (
    <div className="mt-5">
      <div className="max-w-screen-xl px-2 mx-auto pt-6 pb-10">
        {/* <Breadcrumb breadcrumbList={breadcrumbList} /> */}

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
