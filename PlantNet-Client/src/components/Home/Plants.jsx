import Card from "./Card";
import Container from "../Shared/Container";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "../Shared/LoadingSpinner";

const Plants = () => {
  const { data: plantsData, isLoading } = useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/plants`
      );
      return data;
    },
  });
  if (isLoading)
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  return (
    <Container>
      <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {plantsData.map((plant) => (
          <Card key={plant._id} plant={plant} />
        ))}
      </div>
    </Container>
  );
};

export default Plants;
