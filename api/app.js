require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);

const knex = require("knex")({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.json({
    limit: "8mb",
  })
);

app.get("/result", async (req, res) => {
  try {
    const votes = await knex("votes").select('candidate')
    .count("candidate", { as: "count" })
    .groupBy("candidate")
    .as("counts");

    return res.send(votes.reduce((obj, item) => Object.assign(obj, { [item.candidate]: item.count }), {}));
  } catch (error) {
    console.log(error);
  }
});

app.post("/votes", async (req, res) => {
  try {
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const candidate = req.body.candidate;

    let date = new Date();

    const haveVoteToday = await knex("votes")
      // TODO: tambah batasan waktu
      // .where("created_at", ">=", date.setHours(0, 0, 0, 0))
      // .where("created_at", "<", date.setHours(23, 59, 59))
      .where((q) => q.where("email", email).orWhere("phone", phone))
      .first();

    if (haveVoteToday) {
      return res
        .status(400)
        .send({ message: "Vote Minimal 1 kali per email/nomor HP" });
    }

    const id = await knex("votes").insert({
      name,
      phone,
      email,
      candidate,
    });

    res.json({
      id: id[0],
      name,
      phone,
      email,
      candidate,
    });
  } catch (e) {
    console.log(e);
    // next(e)
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
