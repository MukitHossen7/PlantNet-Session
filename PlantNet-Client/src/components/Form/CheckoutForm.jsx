/* eslint-disable react-hooks/exhaustive-deps */
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import "./CheckoutForm.css";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line react/prop-types
const CheckoutForm = ({ closeModal, purchaseInfo, refetch, quantityValue }) => {
  const [clientSecret, setClientSecret] = useState("");
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  useEffect(() => {
    getPaymentIntent();
  }, [purchaseInfo]);

  const getPaymentIntent = async () => {
    const { data } = await axiosSecure.post(`/create-payment-intent`, {
      quantity: purchaseInfo.quantity,
      plantId: purchaseInfo.plantId,
    });
    setClientSecret(data);
  };
  const stripe = useStripe();
  const elements = useElements();
  const handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }
    const card = elements.getElement(CardElement);

    if (card == null) {
      return;
    }
    // Use your card Element with other Stripe.js APIs
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card,
    });

    if (error) {
      console.log("[error]", error);
      return;
    } else {
      console.log("[PaymentMethod]", paymentMethod);
    }
    // Confirm a card payment
    const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          name: purchaseInfo?.customer?.name,
          email: purchaseInfo?.customer?.email,
        },
      },
    });

    if (paymentIntent.status === "succeeded") {
      // delete
      try {
        const { data } = await axiosSecure.post(`/orders`, {
          ...purchaseInfo,
          transitionId: paymentIntent.id,
        });
        await axiosSecure.patch(`/orders/quantity/${purchaseInfo?.plantId}`, {
          totalQuantity: quantityValue,
          status: "decrease",
        });
        refetch();
        if (data.insertedId) {
          toast.success("Purchase successful");
          navigate("/dashboard/my-orders");
        }
      } catch (err) {
        console.log(err);
      } finally {
        closeModal();
      }
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit} className="">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
        <div className="flex justify-around">
          <button
            type="submit"
            disabled={!stripe || !clientSecret}
            className="bg-lime-500 px-4 py-2 text-white rounded-md"
          >
            {`Pay ${purchaseInfo?.price}`}
          </button>
          <button
            onClick={closeModal}
            className="bg-red-400 px-4 py-2 text-white rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
CheckoutForm.propTypes = {
  purchaseInfo: PropTypes.object,
  price: PropTypes.number,
  stripe: PropTypes.object,
  closeModal: PropTypes.func.isRequired,
};

export default CheckoutForm;
