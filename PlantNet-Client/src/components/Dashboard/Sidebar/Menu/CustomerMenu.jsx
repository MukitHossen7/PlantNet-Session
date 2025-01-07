import { BsFingerprint } from "react-icons/bs";
import { GrUserAdmin } from "react-icons/gr";
import MenuItem from "./MenuItem";
import { useContext, useState } from "react";
import BecomeSellerModal from "../../../Modal/BecomeSellerModal";
import { AuthContext } from "./../../../../providers/AuthProvider";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import toast from "react-hot-toast";
const CustomerMenu = () => {
  const { user } = useContext(AuthContext);
  const axiosSecure = useAxiosSecure();
  console.log(user);
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
  };
  const handleRequest = async () => {
    try {
      const { data } = await axiosSecure.patch(`/check_user/${user?.email}`);
      console.log(data);
      toast.success("Request sent successfully!");
    } catch (err) {
      toast.error("You have already requested, wait for some time");
      console.log(err);
    }
    closeModal();
  };
  return (
    <>
      <MenuItem icon={BsFingerprint} label="My Orders" address="my-orders" />

      <div
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 mt-5  transition-colors duration-300 transform text-gray-600  hover:bg-gray-300   hover:text-gray-700 cursor-pointer"
      >
        <GrUserAdmin className="w-5 h-5" />

        <span className="mx-4 font-medium">Become A Seller</span>
      </div>

      <BecomeSellerModal
        closeModal={closeModal}
        isOpen={isOpen}
        handleRequest={handleRequest}
      />
    </>
  );
};

export default CustomerMenu;
