import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import "./CheckoutForm.css";
import PropTypes from "prop-types";
// eslint-disable-next-line react/prop-types
const CheckoutForm = ({ closeModal, purchaseInfo }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
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
    } else {
      console.log("[PaymentMethod]", paymentMethod);
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
            disabled={!stripe}
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
  purchaseInfo: PropTypes.shape({
    price: PropTypes.number.isRequired,
  }).isRequired,
  stripe: PropTypes.object,
  closeModal: PropTypes.func.isRequired,
};

export default CheckoutForm;
