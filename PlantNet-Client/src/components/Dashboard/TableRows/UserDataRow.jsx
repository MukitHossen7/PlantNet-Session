/* eslint-disable react/prop-types */
import { useState } from "react";
import UpdateUserModal from "../../Modal/UpdateUserModal";
import PropTypes from "prop-types";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import toast from "react-hot-toast";

const UserDataRow = ({ userData, refetch }) => {
  const { role, status, email } = userData || {};
  const [isOpen, setIsOpen] = useState(false);
  const axiosSecure = useAxiosSecure();
  //update the role function
  const handleUpdateRole = async (updataValue) => {
    if (role === updataValue) return;
    try {
      await axiosSecure.patch(`/single-user/role/${email}`, {
        role: updataValue,
      });
      toast.success("Role updated successfully");
      refetch();
    } catch (error) {
      console.log(error);
    } finally {
      setIsOpen(false);
    }
  };
  return (
    <tr>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{email}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{role}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        {status ? (
          <p
            className={` whitespace-no-wrap ${
              status === "Verify" ? "text-green-500" : "text-yellow-500"
            }`}
          >
            {status}
          </p>
        ) : (
          <p className="text-red-500 whitespace-no-wrap">Unlivable</p>
        )}
      </td>

      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <span
          onClick={() => setIsOpen(true)}
          className="relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-green-200 opacity-50 rounded-full"
          ></span>
          <span className="relative">Update Role</span>
        </span>
        {/* Modal */}
        <UpdateUserModal
          role={role}
          handleUpdateRole={handleUpdateRole}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </td>
    </tr>
  );
};

UserDataRow.propTypes = {
  user: PropTypes.object,
  refetch: PropTypes.func,
};

export default UserDataRow;
