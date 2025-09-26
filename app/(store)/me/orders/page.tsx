"use client";

import { Order, OrderItem, Product, ProductVariant } from "@prisma/client"; // Import necessary types
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming these are from your shadcn/ui setup
import { Package, XCircle, Clock, CheckCircle } from "lucide-react"; // Icons for status
import Image from "next/image"; // For optimized images
import Link from "next/link";
import useSWR from "swr";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { formatCurrencyValue } from "@/utils/format-currency-value";

// Extend the Order type to include relations fetched from the API
type OrderWithDetails = Order & {
  items: (OrderItem & {
    productVariant: ProductVariant & {
      product: Pick<Product, "name" | "images" | "id">; // Pick only necessary product fields
    };
  })[];
};

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error: any = new Error(
        errorData.error || "Failed to fetch orders."
      );
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

const OrdersPageContent = () => {
  // Renamed for clarity, assuming it's used inside a wrapper component
  const router = useRouter();
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [orders, setOrders] = useState<OrderWithDetails[] | null>(null); // Use the extended type

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // We'll skip the `/api/me` call here as the parent layout/page should handle user authentication
  //       // and ensure the user is logged in before rendering this component.
  //       // If this component can be accessed without a user, you'd need the `/api/me` call here.

  //       const ordersRes = await fetch("/api/orders");
  //       if (ordersRes.ok) {
  //         const ordersData = await ordersRes.json();
  //         setOrders(ordersData.orders);
  //       } else {
  //         const errorData = await ordersRes.json();
  //         setError(errorData.error || "Failed to fetch orders.");
  //         console.error("Failed to fetch orders:", ordersRes.status, errorData);
  //         // If orders fail to load, and it's due to unauthorized, you might still want to redirect
  //         if (ordersRes.status === 401) {
  //           router.push("/sign-in?redirectUrl=/orders");
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Network or parsing error during data fetch:", err);
  //       setError(
  //         "Network error: Could not connect to the server or parse response."
  //       );
  //       // router.push("/sign-in?redirectUrl=/orders"); // Only redirect if not authenticated, not just network error
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, [router]);

  // if (isLoading) {
  //   return (
  //     <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  //         {/* <p className="text-lg text-gray-700">Loading your orders...</p> */}
  //       </div>
  //     </section>
  //   );
  // }

  // if (error) {
  //   return (
  //     <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center bg-red-50">
  //       <div className="p-6 border border-red-300 rounded-md bg-red-100 text-red-800 text-center">
  //         <p className="text-xl font-semibold mb-3">Error loading orders:</p>
  //         <p className="mb-4">{error}</p>
  //         <button
  //           onClick={() => window.location.reload()} // Simple reload to retry
  //           className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition"
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </section>
  //   );
  // }

  const { data, error, isLoading } = useSWR("/api/orders", fetcher);

  if (error && error.status === 401) {
    router.prefetch(`/sign-in?redirect_url=${encodeURI("/me/orders")}`);
    router.push(`/sign-in?redirect_url=${encodeURI("/me/orders")}`);
    return null;
  }

  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  // if (error) {
  //   return (
  //     <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center bg-red-50">
  //       <div className="p-6 border border-red-300 rounded-md bg-red-100 text-red-800 text-center">
  //         <p className="text-xl font-semibold mb-3">Error loading orders:</p>
  //         <p className="mb-4">{error.message}</p>
  //         <button
  //           onClick={() => window.location.reload()}
  //           className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition"
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </section>
  //   );
  // }

  const orders: OrderWithDetails[] | null = data?.orders ?? null;

  // If no orders data available after loading
  if (!orders) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Failed to load orders. Please try again.
        </p>
      </section>
    );
  }

  const ongoingOrDeliveredOrders = orders.filter(
    (order) => order.status !== "CANCELLED"
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === "CANCELLED"
  );

  return (
    <section className="max-w-screen-xl mx-auto mt-10 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Your Orders</h1>
        <p className="text-gray-600 mb-8">Manage and track your purchases.</p>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              No Orders Yet!
            </p>
            <p className="text-gray-500">
              Looks like you haven't placed any orders. Start shopping now!
            </p>
            <HoverPrefetchLink
              href="/"
              className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition duration-300"
            >
              Go to Homepage
            </HoverPrefetchLink>
          </div>
        ) : (
          <Tabs defaultValue="ongoing" className="w-full mt-5">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger
                value="ongoing"
                className="text-sm md:text-base font-semibold uppercase transition-all duration-200"
              >
                Ongoing & Delivered
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="text-sm md:text-base font-semibold uppercase transition-all duration-200"
              >
                Cancelled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ongoing" className="mt-8">
              {ongoingOrDeliveredOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    No active orders found.
                  </p>
                  <p className="text-gray-500">
                    Check the 'Cancelled' tab or start a new order!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 w-full">
                  {ongoingOrDeliveredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-8">
              {cancelledOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    No cancelled orders.
                  </p>
                  <p className="text-gray-500">All good here!</p>
                </div>
              ) : (
                <div className="grid gap-6 w-full">
                  {cancelledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isCancelled={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  );
};

export default OrdersPageContent;

// --- Order Card Component (Extracted for better readability) ---
interface OrderCardProps {
  order: OrderWithDetails;
  isCancelled?: boolean; // To apply specific styling for cancelled orders
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isCancelled = false,
}) => {
  const firstItem = order.items[0];
  const totalItems = order.items.length;

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "PAID":
        return "text-blue-600 bg-blue-100";
      case "SHIPPED":
        return "text-purple-600 bg-purple-100";
      case "DELIVERED":
        return "text-green-600 bg-green-100";
      case "CANCELLED":
        return "text-red-600 bg-red-100";
      case "REFUNDED":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 mr-1" />;
      case "PAID":
        return <CheckCircle className="w-4 h-4 mr-1" />; // Placeholder, maybe a payment icon
      case "SHIPPED":
        return <Package className="w-4 h-4 mr-1" />;
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 mr-1" />;
      case "REFUNDED":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
      relative p-6 rounded-lg shadow-lg border
      ${
        isCancelled
          ? "border-red-300 bg-red-50 opacity-80"
          : "border-gray-200 bg-white"
      }
      flex flex-col
    `}
    >
      {/* Order Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">
          Order #{order.id.substring(0, 8).toUpperCase()}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusIcon(order.status)}
          {order.status}
        </span>
      </div>

      {/* Order Details */}
      <div className="mb-4 text-gray-700">
        <p className="text-sm">
          <span className="font-medium">Total:</span>
          {formatCurrencyValue(order.total)}
        </p>
        <p className="text-sm">
          <span className="font-medium">Placed on:</span>{" "}
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        {order.deliveredAt && (
          <p className="text-sm text-green-700">
            <span className="font-medium">Delivered:</span>{" "}
            {new Date(order.deliveredAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
        {order.cancelledAt && (
          <p className="text-sm text-red-700">
            <span className="font-medium">Cancelled:</span>{" "}
            {new Date(order.cancelledAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <hr className="my-4 border-gray-100" />

      {/* First Item Display */}
      {firstItem ? (
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-md mb-4 flex-grow">
          {firstItem.productVariant.product.images?.[0] && (
            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-gray-200">
              <Image
                src={firstItem.productVariant.product.images[0]}
                alt={firstItem.productVariant.product.name}
                layout="fill"
                objectFit="cover"
                className="rounded"
              />
            </div>
          )}
          <div className="flex-grow">
            <p className="text-base font-semibold text-gray-800 line-clamp-1">
              {firstItem.productVariant.product.name}
            </p>
            <p className="text-sm text-gray-600">
              {firstItem.quantity} x {formatCurrencyValue(firstItem.price)}
              {firstItem.productVariant.color &&
                ` - ${firstItem.productVariant.color}`}
              {firstItem.productVariant.size &&
                ` (${firstItem.productVariant.size})`}
            </p>
            {totalItems > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                + {totalItems - 1} more item{totalItems - 1 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic flex-grow">
          No items found for this order.
        </p>
      )}

      {/* View Details Button */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <HoverPrefetchLink
          href={`/me/orders/details/${order.id}`}
          className="block text-center bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-md font-medium transition duration-300"
        >
          View Order Details
        </HoverPrefetchLink>
      </div>
    </div>
  );
};
