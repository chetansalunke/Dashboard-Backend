import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.log(`Something went wrong server not setup properly ${error}`);
  } else {
    console.log(`Server is Running on the port ${PORT}`);
  }
});
