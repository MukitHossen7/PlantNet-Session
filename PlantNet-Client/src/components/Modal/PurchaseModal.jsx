/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { AuthContext } from "./../../providers/AuthProvider";
import toast from "react-hot-toast";
// import useAxiosSecure from "../../hooks/useAxiosSecure";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../Form/CheckoutForm";
const stripePromise = loadStripe(import.meta.env.VITE_PAYMENT_PUBLISHABLE_KEY);
const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  const { user } = useContext(AuthContext);
  // const axiosSecure = useAxiosSecure();
  const { category, name, price, quantity, _id, seller } = plant || {};
  const [quantityValue, setQuantityValue] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);

  const [purchaseInfo, setPurchaseInfo] = useState({
    plantId: _id,
    price: parseInt(totalPrice),
    quantity: quantityValue,
    seller: seller.email,
    address: "",
    status: "pending",
  });

  useEffect(() => {
    setPurchaseInfo((prev) => ({
      ...prev,
      customer: {
        email: user?.email,
        name: user?.displayName,
        image: user?.photoURL,
      },
    }));
  }, [user, plant]);
  const handleQuantityChange = (value) => {
    if (value > quantity) {
      setQuantityValue(quantity);
      return toast.error("Quantity exceeds available stock");
    }
    if (value <= 0) {
      setQuantityValue(quantity);
      return toast.error("Quantity cannot be decreased");
    }
    setQuantityValue(value);
    setTotalPrice(value * price);
    setPurchaseInfo((pre) => {
      return { ...pre, quantity: value, price: value * price };
    });
  };

  // const handlePurchase = async () => {
  //   try {
  //     const { data } = await axiosSecure.post(`/orders`, purchaseInfo);
  //     await axiosSecure.patch(`/orders/quantity/${_id}`, {
  //       totalQuantity: quantityValue,
  //       status: "decrease",
  //     });
  //     refetch();
  //     if (data.insertedId) {
  //       toast.success("Purchase successful");
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   } finally {
  //     closeModal();
  //   }
  // };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {price}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {quantity}
                  </p>
                </div>
                <div className="text-sm flex items-center mt-2">
                  <label htmlFor="quantity" className="block text-gray-600">
                    Quantity :
                  </label>
                  <input
                    className=" px-4 py-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    defaultValue={quantityValue}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value))
                    }
                    name="quantity"
                    type="number"
                    placeholder="Available quantity"
                    required
                  />
                </div>
                <div className="text-sm flex items-center mt-2">
                  <label htmlFor="quantity" className="block text-gray-600">
                    Address :
                  </label>
                  <input
                    className=" px-4 py-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="address"
                    onChange={(e) =>
                      setPurchaseInfo((pre) => {
                        return { ...pre, address: e.target.value };
                      })
                    }
                    type="text"
                    placeholder="Shipping address"
                    required
                  />
                </div>
                {/* payment related work */}
                <Elements stripe={stripePromise}>
                  {/* from component use */}
                  <CheckoutForm
                    closeModal={closeModal}
                    purchaseInfo={purchaseInfo}
                    refetch={refetch}
                    quantityValue={quantityValue}
                  ></CheckoutForm>
                </Elements>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
