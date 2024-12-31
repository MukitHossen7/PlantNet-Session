import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imageUpload } from "../../../api/utils";
import { useContext, useState } from "react";
import { AuthContext } from "../../../providers/AuthProvider";
import axios from "axios";
import toast from "react-hot-toast";

const AddPlant = () => {
  const { user } = useContext(AuthContext);
  const [upLoadImages, setUpLoadImages] = useState("");
  const handlePlantDataFrom = async (e) => {
    e.preventDefault();
    const from = e.target;
    const name = from.name.value;
    const category = from.category.value;
    const description = from.description.value;
    const price = from.price.value;
    const quantity = from.quantity.value;
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
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/plants`,
        plantData
      );
      if (data.insertedId) {
        toast.success("Plants added successfully");
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
