import PropTypes from "prop-types";
import { useState } from "react";
import DeleteModal from "../../Modal/DeleteModal";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import toast from "react-hot-toast";
import LoadingSpinner from "../../Shared/LoadingSpinner";
// eslint-disable-next-line react/prop-types
const CustomerOrderDataRow = ({ order, refetch, isLoading }) => {
  const { image, name, category, price, quantity, status, _id, plantId } =
    order || {};
  console.log(order);
  const axiosSecure = useAxiosSecure();
  let [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);
  const handleDelete = async () => {
    try {
      await axiosSecure.delete(`/orders/${_id}`);
      await axiosSecure.patch(`/orders/quantity/${plantId}`, {
        totalQuantity: quantity,
        status: "increase",
      });
      refetch();
      toast.success("Order deleted successfully");
    } catch (err) {
      toast.error("cannot cancel once the product is delivered");
      console.log(err);
    } finally {
      closeModal();
    }
  };
  if (isLoading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <tr>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="block relative">
              <img
                alt="profile"
                src={image}
                className="mx-auto object-cover rounded h-10 w-15 "
              />
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{name}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{category}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">${price}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{quantity}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{status}</p>
      </td>

      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <button
          onClick={() => setIsOpen(true)}
          className={`relative disabled:cursor-not-allowed cursor-pointer inline-block px-3 py-1 font-semibold text-lime-900 leading-tight ${
            status === "delivered" ? "disabled" : ""
          }`}
        >
          <span className="absolute cursor-pointer inset-0 bg-red-200 opacity-50 rounded-full"></span>
          <span
            className={`relative cursor-pointer ${
              status === "delivered" ? "cursor-not-allowed" : ""
            }`}
          >
            Cancel
          </span>
        </button>

        <DeleteModal
          isOpen={isOpen}
          closeModal={closeModal}
          handleDelete={handleDelete}
        />
      </td>
    </tr>
  );
};

CustomerOrderDataRow.propTypes = {
  order: PropTypes.object,
  refetch: PropTypes.func,
};

export default CustomerOrderDataRow;
