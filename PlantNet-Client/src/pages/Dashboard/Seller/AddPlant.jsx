import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imageUpload } from "../../../api/utils";
import { useContext, useState } from "react";
import { AuthContext } from "../../../providers/AuthProvider";

import toast from "react-hot-toast";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const AddPlant = () => {
  const { user } = useContext(AuthContext);
  const axiosSecure = useAxiosSecure();
  const [upLoadImages, setUpLoadImages] = useState("");
  const navigate = useNavigate();
  const handlePlantDataFrom = async (e) => {
    e.preventDefault();
    const from = e.target;
    const name = from.name.value;
    const category = from.category.value;
    const description = from.description.value;
    const price = parseFloat(from.price.value);
    const quantity = parseInt(from.quantity.value);
    const image = from.image.files[0];
    const imageURL = await imageUpload(image);
    const seller = {
      name: user?.displayName,
      image: user?.photoURL,
      email: user?.email,
    };
    const plantData = {
      name,
      category,
      description,
      price,
      quantity,
      image: imageURL,
      seller,
    };

    try {
      const { data } = await axiosSecure.post(
        `${import.meta.env.VITE_API_URL}/plants`,
        plantData
      );
      if (data.insertedId) {
        toast.success("Plants added successfully");
        navigate("/dashboard/my-inventory");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        handlePlantDataFrom={handlePlantDataFrom}
        setUpLoadImages={setUpLoadImages}
        upLoadImages={upLoadImages}
      />
    </div>
  );
};

export default AddPlant;
