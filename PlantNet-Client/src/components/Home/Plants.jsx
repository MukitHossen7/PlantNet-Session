import Card from "./Card";
import Container from "../Shared/Container";
import { useEffect, useState } from "react";
import axios from "axios";

const Plants = () => {
  const [plants, setPlants] = useState([]);
  useEffect(() => {
    const fetchPlants = async () => {
      const { data } = await axios(`${import.meta.env.VITE_API_URL}/plants`);
      setPlants(data);
    };
    fetchPlants();
  }, []);

  return (
    <Container>
      <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {plants.map((plant) => (
          <Card key={plant._id} plant={plant} />
        ))}
      </div>
    </Container>
  );
};

export default Plants;
