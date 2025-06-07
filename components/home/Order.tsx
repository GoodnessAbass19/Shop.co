import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

const Order = async ({ user }: { user: User }) => {
  const orders = await prisma.order.findMany({
    where: {
      buyerId: user.id,
    },
    include: {
      items: true, // Include order items if needed
    },
  });

  console.log(orders);
  return (
    <div>
      Order Lorem ipsum dolor sit amet, consectetur adipisicing elit. Explicabo
      repellendus iure aspernatur laborum aliquid molestiae similique quaerat
      voluptas quo maxime, sunt animi rem quod soluta tempore, illo minus,
      fugiat vel.
    </div>
  );
};

export default Order;
