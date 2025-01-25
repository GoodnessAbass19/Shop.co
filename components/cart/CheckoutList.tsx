const CheckoutList = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex justify-between items-center font-medium">
      <span className="text-primary-gray text-sm md:text-base">{title}</span>
      <span className="text-primary-gray text-sm md:text-base">{value}</span>
    </div>
  );
};

export default CheckoutList;
