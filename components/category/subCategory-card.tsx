import Image from "next/image";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

const subCategoryCard = ({ item }: { item: SubCategory }) => {
  return (
    <div className="rounded-lg col-span-1">
      <Image
        src={
          item?.image ||
          "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image"
        }
        alt={item.name}
        width={500}
        height={500}
        loading="lazy"
        className="w-full h-full"
      />
      <h3 className="text-sm font-semibold text-center">{item.name}</h3>
    </div>
  );
};

export default subCategoryCard;
